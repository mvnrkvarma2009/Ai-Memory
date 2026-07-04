"""End-to-end backend API tests for AI Memory.

Covers:
- Auth: unauthenticated /auth/me returns 401; with Bearer token returns user.
- Memory generate: happy path (LLM), validation (empty / <40 chars).
- Memory list / get / delete + 404 for unknown ids.
- Ownership isolation (User A cannot read User B's package).
- Logout invalidates the session.
"""
import pytest
from .conftest import API


# ------------------------ Auth ------------------------

class TestAuth:
    def test_me_requires_auth(self, anon_client):
        r = anon_client.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_with_bearer(self, client_a, session_a):
        r = client_a.get(f"{API}/auth/me")
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["user_id"] == session_a["user_id"]
        assert data["email"] == session_a["email"]
        assert "_id" not in data  # ObjectId must be excluded

    def test_me_with_cookie(self, session_a):
        import requests
        s = requests.Session()
        s.cookies.set("session_token", session_a["token"])
        r = s.get(f"{API}/auth/me")
        assert r.status_code == 200
        assert r.json()["user_id"] == session_a["user_id"]

    def test_me_with_invalid_token(self, anon_client):
        r = anon_client.get(f"{API}/auth/me", headers={"Authorization": "Bearer nonsense-token-xyz"})
        assert r.status_code == 401


# ------------------------ Generate validation ------------------------

class TestGenerateValidation:
    def test_generate_requires_auth(self, anon_client):
        r = anon_client.post(f"{API}/memory/generate", json={"transcript": "x" * 200})
        assert r.status_code == 401

    def test_generate_empty_transcript(self, client_a):
        r = client_a.post(f"{API}/memory/generate", json={"transcript": ""})
        assert r.status_code == 400

    def test_generate_short_transcript(self, client_a):
        r = client_a.post(f"{API}/memory/generate", json={"transcript": "too short"})
        assert r.status_code == 400


# ------------------------ Generate + CRUD (LLM-backed) ------------------------

@pytest.fixture(scope="class")
def generated_package(session_a, sample_transcript):
    """Class-scoped: generate ONE package for User A and reuse across tests
    to save LLM cost / time."""
    import requests
    s = requests.Session()
    s.headers.update({
        "Content-Type": "application/json",
        "Authorization": f"Bearer {session_a['token']}",
    })
    payload = {
        "transcript": sample_transcript,
        "source_ai": "Claude",
        "target_ai": "ChatGPT",
        "project_title": "FlowBoard",
    }
    r = s.post(f"{API}/memory/generate", json=payload, timeout=90)
    assert r.status_code == 200, f"Generate failed: {r.status_code} {r.text[:500]}"
    return r.json()


class TestGenerateAndCrud:
    def test_generate_success_shape(self, generated_package):
        pkg = generated_package
        for f in ("id", "user_id", "project_title", "source_ai", "target_ai", "package", "markdown", "created_at"):
            assert f in pkg, f"missing field {f}"
        assert pkg["source_ai"] == "Claude"
        assert pkg["target_ai"] == "ChatGPT"
        assert pkg["project_title"] == "FlowBoard"
        assert isinstance(pkg["markdown"], str) and len(pkg["markdown"]) > 100
        p = pkg["package"]
        for f in ("one_liner", "project_goal", "current_state", "handoff_prompt"):
            assert isinstance(p[f], str), f"{f} must be a string"
        for f in ("tech_stack", "completed_work", "pending_work",
                  "architecture_decisions", "constraints", "key_components",
                  "open_questions", "next_tasks"):
            assert isinstance(p[f], list), f"{f} must be a list"
        # At least SOME structured content should be populated for a rich transcript.
        assert p["project_goal"].strip() != ""
        assert p["handoff_prompt"].strip() != ""
        assert len(p["tech_stack"]) > 0
        assert len(p["next_tasks"]) > 0

    def test_generate_autosaved_in_list(self, client_a, generated_package):
        r = client_a.get(f"{API}/memory")
        assert r.status_code == 200
        ids = [p["id"] for p in r.json()]
        assert generated_package["id"] in ids

    def test_list_sorted_desc(self, client_a):
        r = client_a.get(f"{API}/memory")
        assert r.status_code == 200
        arr = r.json()
        created = [p["created_at"] for p in arr]
        assert created == sorted(created, reverse=True)

    def test_get_by_id(self, client_a, generated_package):
        pid = generated_package["id"]
        r = client_a.get(f"{API}/memory/{pid}")
        assert r.status_code == 200
        assert r.json()["id"] == pid

    def test_get_unknown_id_returns_404(self, client_a):
        r = client_a.get(f"{API}/memory/definitely-not-a-real-id-xyz")
        assert r.status_code == 404

    def test_ownership_isolation(self, client_b, generated_package):
        """User B must not be able to fetch User A's package."""
        pid = generated_package["id"]
        r = client_b.get(f"{API}/memory/{pid}")
        assert r.status_code == 404

    def test_delete_unknown_id_returns_404(self, client_a):
        r = client_a.delete(f"{API}/memory/no-such-id-abc")
        assert r.status_code == 404

    def test_delete_owned(self, client_a, generated_package):
        pid = generated_package["id"]
        r = client_a.delete(f"{API}/memory/{pid}")
        assert r.status_code == 200
        assert r.json().get("success") is True  # noqa: E712 - explicit boolean check in test
        # Confirm gone
        r2 = client_a.get(f"{API}/memory/{pid}")
        assert r2.status_code == 404


# ------------------------ Logout ------------------------

class TestLogout:
    def test_logout_invalidates_bearer(self, mongo_db):
        """Create a fresh throwaway session so we don't kill the shared fixture."""
        from datetime import datetime, timezone, timedelta
        import uuid
        import requests
        token = f"pytest_logout_{uuid.uuid4().hex[:10]}"
        user_id = f"pytest-logout-{uuid.uuid4().hex[:8]}"
        mongo_db.users.insert_one({
            "user_id": user_id,
            "email": f"logout.{user_id}@example.com",
            "name": "Logout User",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        mongo_db.user_sessions.insert_one({
            "user_id": user_id, "session_token": token,
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=7)).isoformat(),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        try:
            s = requests.Session()
            s.headers.update({"Authorization": f"Bearer {token}"})
            assert s.get(f"{API}/auth/me").status_code == 200
            r = s.post(f"{API}/auth/logout")
            assert r.status_code == 200
            # Now the token should be invalid
            assert s.get(f"{API}/auth/me").status_code == 401
        finally:
            mongo_db.user_sessions.delete_many({"user_id": user_id})
            mongo_db.users.delete_one({"user_id": user_id})
