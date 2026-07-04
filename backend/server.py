from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import re
import json
import logging
import uuid
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import httpx
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

app = FastAPI(title="AI Memory API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("ai_memory")

EMERGENT_AUTH_URL = "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data"


# ----------------------------- Models -----------------------------
class User(BaseModel):
    user_id: str
    email: str
    name: Optional[str] = None
    picture: Optional[str] = None
    created_at: Optional[str] = None


class GenerateRequest(BaseModel):
    transcript: str
    source_ai: str = "Claude"
    target_ai: str = "ChatGPT"
    project_title: Optional[str] = None


class MemorySections(BaseModel):
    one_liner: str = ""
    project_goal: str = ""
    current_state: str = ""
    tech_stack: List[str] = Field(default_factory=list)
    completed_work: List[str] = Field(default_factory=list)
    pending_work: List[str] = Field(default_factory=list)
    architecture_decisions: List[str] = Field(default_factory=list)
    constraints: List[str] = Field(default_factory=list)
    key_components: List[str] = Field(default_factory=list)
    open_questions: List[str] = Field(default_factory=list)
    next_tasks: List[str] = Field(default_factory=list)
    handoff_prompt: str = ""


class MemoryPackage(BaseModel):
    id: str
    user_id: str
    project_title: str
    source_ai: str
    target_ai: str
    package: MemorySections
    markdown: str
    created_at: str
    share_id: Optional[str] = None


class PublicPackage(BaseModel):
    id: str
    project_title: str
    source_ai: str
    target_ai: str
    package: MemorySections
    markdown: str
    created_at: str


class HandoffMessage(BaseModel):
    role: str
    content: str
    ts: str
    seed: bool = False


class HandoffChat(BaseModel):
    id: str
    user_id: str
    package_id: str
    project_title: str
    provider: str
    model: str
    byok: bool = False
    messages: List[HandoffMessage]
    created_at: str
    updated_at: str


class HandoffStartRequest(BaseModel):
    provider: str
    model: str
    api_key: Optional[str] = None


class HandoffMessageRequest(BaseModel):
    content: str
    api_key: Optional[str] = None


PROVIDER_LABELS = {
    "openai": "ChatGPT (OpenAI)",
    "anthropic": "Claude (Anthropic)",
    "gemini": "Gemini (Google)",
}
ALLOWED_PROVIDERS = set(PROVIDER_LABELS.keys())


def _resolve_key(api_key):
    """Return (key, is_byok). A non-emergent key routes directly to the provider."""
    k = (api_key or "").strip()
    if k:
        return k, not k.startswith("sk-emergent-")
    return EMERGENT_LLM_KEY, False


def _handoff_system(label):
    return (
        f"You are {label}. You are taking over an in-progress project from another AI assistant. "
        "A structured memory package will be provided. Absorb every detail — the goal, current state, "
        "completed and pending work, architecture decisions, constraints, key components and next tasks — "
        "and continue the work as if you had been involved from the very beginning. Be concrete and "
        "reference specifics from the package rather than speaking generically."
    )


def _to_initial_messages(messages):
    out = []
    for m in messages:
        if m["role"] == "user":
            out.append({"role": "user", "content": [{"type": "text", "text": m["content"]}]})
        else:
            out.append({"role": "assistant", "content": m["content"]})
    return out


# ----------------------------- Auth helpers -----------------------------
def _extract_token(request: Request) -> Optional[str]:
    token = request.cookies.get("session_token")
    if not token:
        auth = request.headers.get("Authorization")
        if auth and auth.startswith("Bearer "):
            token = auth.split(" ", 1)[1]
    return token


async def get_current_user(request: Request) -> dict:
    token = _extract_token(request)
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    session = await db.user_sessions.find_one({"session_token": token}, {"_id": 0})
    if not session:
        raise HTTPException(status_code=401, detail="Invalid session")
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    user = await db.users.find_one({"user_id": session["user_id"]}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ----------------------------- Auth routes -----------------------------
@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        try:
            body = await request.json()
            session_id = body.get("session_id")
        except Exception:
            session_id = None
    if not session_id:
        raise HTTPException(status_code=400, detail="Missing session_id")

    async with httpx.AsyncClient(timeout=20) as c:
        r = await c.get(EMERGENT_AUTH_URL, headers={"X-Session-ID": session_id})
    if r.status_code != 200:
        raise HTTPException(status_code=401, detail="Invalid session")
    data = r.json()
    email = data["email"]

    existing = await db.users.find_one({"email": email}, {"_id": 0})
    if existing:
        user_id = existing["user_id"]
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {"name": data.get("name"), "picture": data.get("picture")}},
        )
    else:
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        await db.users.insert_one({
            "user_id": user_id,
            "email": email,
            "name": data.get("name"),
            "picture": data.get("picture"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })

    session_token = data["session_token"]
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    await db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    response.set_cookie(
        key="session_token", value=session_token, httponly=True, secure=True,
        samesite="none", path="/", max_age=7 * 24 * 60 * 60,
    )
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    return user


@api_router.get("/auth/me")
async def auth_me(user: dict = Depends(get_current_user)):
    return user


@api_router.post("/auth/logout")
async def logout(request: Request, response: Response):
    token = _extract_token(request)
    if token:
        await db.user_sessions.delete_one({"session_token": token})
    response.delete_cookie("session_token", path="/")
    return {"success": True}


# ----------------------------- Memory engine -----------------------------
MEMORY_SYSTEM_PROMPT = """You are the AI Memory Engine — a precise context-extraction system for software and product projects.

You are NOT a summarizer. Your job is to read a raw conversation between a human and an AI assistant, then reconstruct the full working STATE of the project so that a DIFFERENT AI system can continue the work seamlessly without any prior context.

Extract concrete, specific, technical facts. Prefer exact names (files, functions, libraries, endpoints, models, versions) over vague descriptions. Never invent facts that are not supported by the transcript; if something is unknown, leave the field empty or note it in open_questions.

You must respond with a SINGLE valid JSON object and NOTHING else — no markdown fences, no commentary. Use this exact schema:

{
  "project_title": string,            // short descriptive project name
  "one_liner": string,                // one sentence describing what is being built
  "project_goal": string,             // 2-4 sentences on the overall objective and why
  "current_state": string,            // where the project currently stands right now
  "tech_stack": string[],             // languages, frameworks, libraries, services, models
  "completed_work": string[],         // specific things already done/working
  "pending_work": string[],           // specific things still to do / in progress
  "architecture_decisions": string[], // key technical/design decisions and their rationale
  "constraints": string[],            // requirements, limits, rules, preferences to respect
  "key_components": string[],         // important files, modules, endpoints, data models
  "open_questions": string[],         // unresolved questions or ambiguities
  "next_tasks": string[],             // the immediate next actions, ordered
  "handoff_prompt": string            // a ready-to-paste opening message addressed to the TARGET AI that primes it to continue the project
}

Every array item must be a concise, standalone bullet (no numbering). Keep the handoff_prompt focused and actionable, written in second person to the target AI."""


def _build_user_prompt(req: GenerateRequest) -> str:
    title_hint = f'\nThe user suggests the project title: "{req.project_title}".' if req.project_title else ""
    return (
        f"SOURCE AI (where this conversation happened): {req.source_ai}\n"
        f"TARGET AI (who will receive the memory package): {req.target_ai}\n"
        f"{title_hint}\n\n"
        f"Tailor the handoff_prompt so it reads naturally when pasted into {req.target_ai}.\n\n"
        f"=== BEGIN CONVERSATION TRANSCRIPT ===\n{req.transcript}\n=== END CONVERSATION TRANSCRIPT ==="
    )


def _parse_json(raw: str) -> dict:
    text = raw.strip()
    text = re.sub(r"^```(json)?", "", text).strip()
    text = re.sub(r"```$", "", text).strip()
    try:
        return json.loads(text)
    except Exception:
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(text[start:end + 1])
        raise


def _as_list(v) -> List[str]:
    if isinstance(v, list):
        return [str(x).strip() for x in v if str(x).strip()]
    if isinstance(v, str) and v.strip():
        return [v.strip()]
    return []


def _render_markdown(title: str, req: GenerateRequest, s: MemorySections) -> str:
    def bullets(items):
        return "\n".join(f"- {i}" for i in items) if items else "_None captured._"

    return f"""# 🧠 AI Memory Package — {title}

> Generated by AI Memory · Source: {req.source_ai} → Target: {req.target_ai}

**{s.one_liner}**

## Handoff Prompt (paste this first)
{s.handoff_prompt}

## Project Goal
{s.project_goal}

## Current State
{s.current_state}

## Tech Stack
{bullets(s.tech_stack)}

## Completed Work
{bullets(s.completed_work)}

## Pending Work
{bullets(s.pending_work)}

## Architecture Decisions
{bullets(s.architecture_decisions)}

## Constraints
{bullets(s.constraints)}

## Key Components
{bullets(s.key_components)}

## Open Questions
{bullets(s.open_questions)}

## Next Tasks
{bullets(s.next_tasks)}
"""


@api_router.post("/memory/generate", response_model=MemoryPackage)
async def generate_memory(req: GenerateRequest, user: dict = Depends(get_current_user)):
    if not req.transcript or not req.transcript.strip():
        raise HTTPException(status_code=400, detail="Transcript is empty")
    if len(req.transcript.strip()) < 40:
        raise HTTPException(status_code=400, detail="Transcript is too short to build a memory package")

    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"mem_{uuid.uuid4().hex[:10]}",
        system_message=MEMORY_SYSTEM_PROMPT,
    ).with_model("anthropic", "claude-sonnet-4-6")

    try:
        raw = await chat.send_message(UserMessage(text=_build_user_prompt(req)))
    except Exception as e:
        logger.exception("LLM generation failed")
        raise HTTPException(status_code=502, detail=f"Memory engine failed: {str(e)}")

    try:
        data = _parse_json(raw)
    except Exception:
        logger.error("Failed to parse LLM JSON. Raw head: %s", raw[:500])
        raise HTTPException(status_code=502, detail="Memory engine returned an unparseable response. Please try again.")

    sections = MemorySections(
        one_liner=str(data.get("one_liner", "")).strip(),
        project_goal=str(data.get("project_goal", "")).strip(),
        current_state=str(data.get("current_state", "")).strip(),
        tech_stack=_as_list(data.get("tech_stack")),
        completed_work=_as_list(data.get("completed_work")),
        pending_work=_as_list(data.get("pending_work")),
        architecture_decisions=_as_list(data.get("architecture_decisions")),
        constraints=_as_list(data.get("constraints")),
        key_components=_as_list(data.get("key_components")),
        open_questions=_as_list(data.get("open_questions")),
        next_tasks=_as_list(data.get("next_tasks")),
        handoff_prompt=str(data.get("handoff_prompt", "")).strip(),
    )

    title = (req.project_title or data.get("project_title") or "Untitled Project").strip() or "Untitled Project"
    markdown = _render_markdown(title, req, sections)

    pkg = MemoryPackage(
        id=str(uuid.uuid4()),
        user_id=user["user_id"],
        project_title=title,
        source_ai=req.source_ai,
        target_ai=req.target_ai,
        package=sections,
        markdown=markdown,
        created_at=datetime.now(timezone.utc).isoformat(),
    )
    await db.memory_packages.insert_one(pkg.model_dump())
    return pkg


@api_router.get("/memory", response_model=List[MemoryPackage])
async def list_memory(user: dict = Depends(get_current_user)):
    docs = await db.memory_packages.find(
        {"user_id": user["user_id"]}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return docs


@api_router.get("/memory/{package_id}", response_model=MemoryPackage)
async def get_memory(package_id: str, user: dict = Depends(get_current_user)):
    doc = await db.memory_packages.find_one(
        {"id": package_id, "user_id": user["user_id"]}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Package not found")
    return doc


@api_router.delete("/memory/{package_id}")
async def delete_memory(package_id: str, user: dict = Depends(get_current_user)):
    res = await db.memory_packages.delete_one({"id": package_id, "user_id": user["user_id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    await db.handoff_chats.delete_many({"package_id": package_id, "user_id": user["user_id"]})
    return {"success": True}


@api_router.post("/memory/{package_id}/share")
async def share_package(package_id: str, user: dict = Depends(get_current_user)):
    pkg = await db.memory_packages.find_one({"id": package_id, "user_id": user["user_id"]}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")
    share_id = pkg.get("share_id")
    if not share_id:
        share_id = uuid.uuid4().hex[:12]
        await db.memory_packages.update_one(
            {"id": package_id, "user_id": user["user_id"]}, {"$set": {"share_id": share_id}}
        )
    return {"share_id": share_id}


@api_router.delete("/memory/{package_id}/share")
async def unshare_package(package_id: str, user: dict = Depends(get_current_user)):
    res = await db.memory_packages.update_one(
        {"id": package_id, "user_id": user["user_id"]}, {"$unset": {"share_id": ""}}
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Package not found")
    return {"success": True}


@api_router.get("/public/memory/{share_id}", response_model=PublicPackage)
async def public_package(share_id: str):
    doc = await db.memory_packages.find_one({"share_id": share_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Shared package not found")
    return doc


# ----------------------------- Direct AI handoff -----------------------------
@api_router.post("/memory/{package_id}/handoff", response_model=HandoffChat)
async def start_handoff(package_id: str, req: HandoffStartRequest, user: dict = Depends(get_current_user)):
    if req.provider not in ALLOWED_PROVIDERS:
        raise HTTPException(status_code=400, detail="Unsupported provider")
    pkg = await db.memory_packages.find_one({"id": package_id, "user_id": user["user_id"]}, {"_id": 0})
    if not pkg:
        raise HTTPException(status_code=404, detail="Package not found")

    label = PROVIDER_LABELS[req.provider]
    system = _handoff_system(label)
    seed = (
        pkg["markdown"]
        + "\n\n---\nConfirm you have fully absorbed this project context. Give a concise 2-3 sentence "
        "recap of where the project currently stands, then list the top 3 next actions you would take. "
        "After that, you're ready to continue the work."
    )
    key, byok = _resolve_key(req.api_key)

    chat = LlmChat(
        api_key=key,
        session_id=f"handoff_{uuid.uuid4().hex[:10]}",
        system_message=system,
    ).with_model(req.provider, req.model)
    try:
        reply = await chat.send_message(UserMessage(text=seed))
    except Exception as e:
        logger.exception("Handoff start failed")
        raise HTTPException(status_code=502, detail=f"Could not reach {label}: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["user_id"],
        "package_id": package_id,
        "project_title": pkg["project_title"],
        "provider": req.provider,
        "model": req.model,
        "byok": byok,
        "system_message": system,
        "messages": [
            {"role": "user", "content": seed, "ts": now, "seed": True},
            {"role": "assistant", "content": reply, "ts": datetime.now(timezone.utc).isoformat(), "seed": False},
        ],
        "created_at": now,
        "updated_at": now,
    }
    await db.handoff_chats.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api_router.post("/handoff/{chat_id}/message", response_model=HandoffChat)
async def handoff_message(chat_id: str, req: HandoffMessageRequest, user: dict = Depends(get_current_user)):
    if not req.content or not req.content.strip():
        raise HTTPException(status_code=400, detail="Message is empty")
    chat_doc = await db.handoff_chats.find_one({"id": chat_id, "user_id": user["user_id"]}, {"_id": 0})
    if not chat_doc:
        raise HTTPException(status_code=404, detail="Conversation not found")

    key, _ = _resolve_key(req.api_key)
    initial = [{"role": "system", "content": chat_doc["system_message"]}] + _to_initial_messages(chat_doc["messages"])
    chat = LlmChat(
        api_key=key,
        session_id=f"handoff_{chat_id[:8]}",
        system_message=chat_doc["system_message"],
        initial_messages=initial,
    ).with_model(chat_doc["provider"], chat_doc["model"])
    try:
        reply = await chat.send_message(UserMessage(text=req.content.strip()))
    except Exception as e:
        logger.exception("Handoff message failed")
        raise HTTPException(status_code=502, detail=f"AI request failed: {str(e)}")

    now = datetime.now(timezone.utc).isoformat()
    new_msgs = [
        {"role": "user", "content": req.content.strip(), "ts": now, "seed": False},
        {"role": "assistant", "content": reply, "ts": datetime.now(timezone.utc).isoformat(), "seed": False},
    ]
    await db.handoff_chats.update_one(
        {"id": chat_id},
        {"$push": {"messages": {"$each": new_msgs}}, "$set": {"updated_at": now}},
    )
    chat_doc["messages"].extend(new_msgs)
    chat_doc["updated_at"] = now
    return chat_doc


@api_router.get("/memory/{package_id}/handoffs", response_model=List[HandoffChat])
async def list_handoffs(package_id: str, user: dict = Depends(get_current_user)):
    docs = await db.handoff_chats.find(
        {"package_id": package_id, "user_id": user["user_id"]}, {"_id": 0}
    ).sort("updated_at", -1).to_list(100)
    return docs


@api_router.get("/handoff/{chat_id}", response_model=HandoffChat)
async def get_handoff(chat_id: str, user: dict = Depends(get_current_user)):
    doc = await db.handoff_chats.find_one({"id": chat_id, "user_id": user["user_id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return doc


@api_router.get("/")
async def root():
    return {"message": "AI Memory API", "status": "ok"}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("user_id")
    await db.user_sessions.create_index("session_token")
    await db.memory_packages.create_index([("user_id", 1), ("created_at", -1)])
    await db.handoff_chats.create_index([("user_id", 1), ("package_id", 1), ("updated_at", -1)])
    await db.memory_packages.create_index("share_id")
    logger.info("AI Memory API started")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
