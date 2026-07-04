"""Shared fixtures for AI Memory backend tests.

Creates two isolated test users + sessions directly in Mongo so we can
verify auth, package generation, and ownership isolation without going
through the real Emergent Google OAuth flow.
"""
import os
import time
import uuid
from datetime import datetime, timezone, timedelta

import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "http://localhost:8001").rstrip("/")
API = f"{BASE_URL}/api"
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def _mk_session(db, label):
    ts = int(time.time() * 1000)
    suffix = uuid.uuid4().hex[:8]
    user_id = f"pytest-user-{label}-{ts}-{suffix}"
    email = f"pytest.{label}.{ts}.{suffix}@example.com"
    token = f"pytest_session_{label}_{ts}_{suffix}"
    db.users.insert_one({
        "user_id": user_id,
        "email": email,
        "name": f"Pytest User {label}",
        "picture": "https://via.placeholder.com/150",
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    db.user_sessions.insert_one({
        "user_id": user_id,
        "session_token": token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"user_id": user_id, "email": email, "token": token}


@pytest.fixture(scope="session")
def mongo_db():
    client = MongoClient(MONGO_URL)
    yield client[DB_NAME]
    client.close()


@pytest.fixture(scope="session")
def session_a(mongo_db):
    s = _mk_session(mongo_db, "A")
    yield s
    # Cleanup
    mongo_db.memory_packages.delete_many({"user_id": s["user_id"]})
    mongo_db.user_sessions.delete_many({"user_id": s["user_id"]})
    mongo_db.users.delete_one({"user_id": s["user_id"]})


@pytest.fixture(scope="session")
def session_b(mongo_db):
    s = _mk_session(mongo_db, "B")
    yield s
    mongo_db.memory_packages.delete_many({"user_id": s["user_id"]})
    mongo_db.user_sessions.delete_many({"user_id": s["user_id"]})
    mongo_db.users.delete_one({"user_id": s["user_id"]})


@pytest.fixture
def client_a(session_a):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_a['token']}",
    })
    return s


@pytest.fixture
def client_b(session_b):
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_b['token']}",
    })
    return s


@pytest.fixture
def anon_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def sample_transcript():
    return (
        "User: I'm building a task management app called FlowBoard using React 18, FastAPI, and PostgreSQL. "
        "Assistant: Got it. Let's start by scaffolding the FastAPI project. We'll use SQLAlchemy 2.0 with async support "
        "and Alembic for migrations. For auth we'll use JWT tokens with a refresh flow. "
        "User: Sounds good. I've already installed fastapi, uvicorn, sqlalchemy, and asyncpg. "
        "Assistant: Great. I'll create /app/backend/main.py with a FastAPI instance, a /health endpoint, and a "
        "/tasks router supporting GET /tasks, POST /tasks, PATCH /tasks/{id}, DELETE /tasks/{id}. "
        "User: We finished the tasks CRUD endpoints and wrote tests for create/read. Next we need to add user auth "
        "with JWT and implement the task board drag-and-drop on the React side using dnd-kit. "
        "Assistant: Perfect. Open questions: should tasks be soft-deleted? Do we need multi-workspace support? "
        "User: Yes, soft-delete tasks with a deleted_at column. Workspaces can wait for v2. Constraint: everything "
        "must run in Docker and deploy to Fly.io. Next task is implementing the /auth/login and /auth/refresh endpoints."
    )
