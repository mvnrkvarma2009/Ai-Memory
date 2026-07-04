![AI Memory](https://static.prod-images.emergentagent.com/jobs/82e747a8-8024-43bc-bcc6-23a312ece398/images/bed1d030fe2a2f94703da9517da1dbac2f3098d85a45708c4ca136320984a076.png)

# 🧠 AI Memory — The AI Project-Memory Engine

> Move a project's full context between AI systems. Never re-explain your work to a new AI again.

AI Memory turns a raw AI conversation (Claude, ChatGPT, Gemini, Cursor…) into a **structured, paste-ready memory package** — and can **send that context directly into another live AI** so it picks up exactly where you left off.

It is **not** a summarizer. It reconstructs the *working state* of a project: goal, current state, completed & pending work, architecture decisions, constraints, key components, open questions and the ordered next tasks.

---

## ✨ Why it exists

You spend hours building something with one AI. It hits its context limit. You switch tools — and suddenly you're re-explaining the entire stack, every decision, and everything that broke. **AI Memory removes that friction.**

```
Old AI conversation ──▶ AI Memory ──▶ structured memory package ──▶ any new AI is caught up in seconds
```

---

## 🚀 Features

- **Memory Engine (Claude Sonnet 4.6)** — extracts real project state into 11 structured sections, not a lossy TL;DR.
- **Direct AI Connection** ⚡ — send the package straight into **ChatGPT · Claude · Gemini** and continue the project in a live chat. Use built-in credits or **bring your own API key** (BYOK, sent directly to the provider, never stored).
- **Target-tuned handoff prompt** — a ready-to-paste opener written for whichever AI you're moving to.
- **Markdown + JSON export** — copy paste-ready markdown or export structured JSON for pipelines.
- **Per-user history** — every package is saved to your account; revisit and reload full context anytime.
- **Google sign-in** — secure session auth.
- **Premium dark-first UI** — Swiss/high-contrast developer-tool aesthetic, light/dark themes, fully responsive.

---

## 🖥️ Tech Stack

| Layer      | Tech |
|------------|------|
| Frontend   | React 19, Tailwind CSS, shadcn/ui, framer-motion, lucide-react |
| Backend    | FastAPI (Python), Motor (async MongoDB) |
| AI         | Claude Sonnet 4.6 (default) · OpenAI · Gemini — via a unified LLM layer with BYOK support |
| Auth       | Google OAuth (httpOnly session cookies, 7-day) |
| Database   | MongoDB (`users`, `user_sessions`, `memory_packages`, `handoff_chats`) |

---

## 🏗️ Architecture

```
React SPA  ──HTTPS──▶  FastAPI (/api/*)  ──▶  MongoDB
                             │
                             └──▶  LLM layer (Claude / OpenAI / Gemini)
```

- All backend routes are prefixed with `/api`.
- Auth resolves a `session_token` cookie first, with an `Authorization: Bearer` fallback.
- The Memory Engine prompts the model for a strict JSON schema, which the backend validates and renders into canonical Markdown.
- Full product & architecture plan lives in [`memory/PRODUCT_ARCHITECTURE.md`](memory/PRODUCT_ARCHITECTURE.md).

### Core API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/session` | Exchange OAuth `session_id` → session cookie |
| `GET`  | `/api/auth/me` | Current user |
| `POST` | `/api/auth/logout` | Clear session |
| `POST` | `/api/memory/generate` | Generate + save a memory package |
| `GET`  | `/api/memory` | List the user's packages |
| `GET/DELETE` | `/api/memory/{id}` | Get / delete a package |
| `POST` | `/api/memory/{id}/handoff` | Send package to a target AI, start a live chat |
| `POST` | `/api/handoff/{chatId}/message` | Continue the handoff conversation |
| `GET`  | `/api/memory/{id}/handoffs` | Resume prior handoff chats |

---

## 🧪 Quality

- Backend: **16/16** API tests passing (auth, generation, CRUD, ownership isolation, logout).
- Full auth-gated frontend flow verified end-to-end (generate → view → export → history → direct AI handoff).

---

## ⚙️ Local Setup

**Prerequisites:** Node ≥ 18, Yarn, Python ≥ 3.11, MongoDB.

### Backend
```bash
cd backend
pip install -r requirements.txt
# .env
#   MONGO_URL="mongodb://localhost:27017"
#   DB_NAME="ai_memory"
#   CORS_ORIGINS="*"
#   EMERGENT_LLM_KEY=...        # or use your own OpenAI/Anthropic/Gemini key via BYOK
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

### Frontend
```bash
cd frontend
yarn install
# .env
#   REACT_APP_BACKEND_URL=http://localhost:8001
yarn start
```

Open `http://localhost:3000`.

---

## 🗺️ Roadmap

- [x] **Direct AI Connection** — send a package into a live ChatGPT/Claude/Gemini chat (BYOK supported)
- [x] **Public share links** — read-only shareable URL for any memory package
- [x] **Browser extension** — one-click "capture context" from an open AI tab (see [`extension/`](extension/))
- [ ] Streaming (token-by-token) generation UI
- [ ] Long-transcript chunking (map-reduce) for very large conversations
- [ ] Team workspaces & package versioning / diff

---

## 📄 License

MIT — free to use and adapt.

<p align="center"><em>Built by <strong>Nagendra Varma Mudunuri</strong> · React · FastAPI · MongoDB · Claude Sonnet 4.6</em></p>
