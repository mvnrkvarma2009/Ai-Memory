"""Backend API tests for public share links.

Covers:
- POST /api/memory/{id}/share is idempotent (same share_id on repeat calls).
- GET /api/public/memory/{share_id} works with NO auth and hides user_id.
- GET /api/public/memory/{badId} returns 404.
- DELETE /api/memory/{id}/share revokes; public GET then returns 404.
- Ownership: user B cannot POST/DELETE share on user A's package.
- List/Get for owner include share_id after sharing.
"""
import uuid
import pytest
import requests
from .conftest import API


# Class-scoped: one shared package for the whole test class
@pytest.fixture(scope="class")
def owned_pkg(session_a, mongo_db):
    """Insert a fake package directly (skip LLM to save time)."""
    pkg_id = str(uuid.uuid4())
    doc = {
        "id": pkg_id,
        "user_id": session_a["user_id"],
        "project_title": "TEST_SharePkg",
        "source_ai": "Claude",
        "target_ai": "ChatGPT",
        "package": {
            "one_liner": "A test project used to verify public sharing.",
            "project_goal": "Verify share endpoints.",
            "current_state": "Ready for testing.",
            "tech_stack": ["FastAPI", "React"],
            "completed_work": ["Wrote share endpoints"],
            "pending_work": ["Verify with tests"],
            "architecture_decisions": [],
            "constraints": [],
            "key_components": [],
            "open_questions": [],
            "next_tasks": ["Run pytest"],
            "handoff_prompt": "Continue the AI Memory project.",
        },
        "markdown": "# TEST_SharePkg\n\n## Handoff Prompt\nContinue the AI Memory project.",
        "created_at": "2026-01-15T00:00:00+00:00",
    }
    mongo_db.memory_packages.insert_one(doc.copy())
    yield {"id": pkg_id, "user_id": session_a["user_id"]}
    mongo_db.memory_packages.delete_many({"id": pkg_id})


class TestPublicShare:
    """Public share link endpoints + ownership isolation."""

    def test_share_requires_auth(self, anon_client, owned_pkg):
        r = anon_client.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 401

    def test_share_unknown_package_404(self, client_a):
        r = client_a.post(f"{API}/memory/no-such-pkg-xyz/share")
        assert r.status_code == 404

    def test_share_create_returns_share_id(self, client_a, owned_pkg):
        r = client_a.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 200, r.text
        data = r.json()
        assert "share_id" in data
        assert isinstance(data["share_id"], str)
        assert len(data["share_id"]) >= 6
        # store on class for reuse
        TestPublicShare._share_id_1 = data["share_id"]

    def test_share_is_idempotent(self, client_a, owned_pkg):
        r = client_a.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 200
        assert r.json()["share_id"] == TestPublicShare._share_id_1

    def test_list_includes_share_id(self, client_a, owned_pkg):
        r = client_a.get(f"{API}/memory")
        assert r.status_code == 200
        matching = [p for p in r.json() if p["id"] == owned_pkg["id"]]
        assert matching, "package missing from list"
        assert matching[0].get("share_id") == TestPublicShare._share_id_1

    def test_get_by_id_includes_share_id(self, client_a, owned_pkg):
        r = client_a.get(f"{API}/memory/{owned_pkg['id']}")
        assert r.status_code == 200
        assert r.json().get("share_id") == TestPublicShare._share_id_1

    def test_public_get_no_auth_hides_user_id(self, anon_client):
        r = anon_client.get(f"{API}/public/memory/{TestPublicShare._share_id_1}")
        assert r.status_code == 200, r.text
        data = r.json()
        # user_id MUST NOT appear
        assert "user_id" not in data
        # But package sections + markdown remain intact
        assert data.get("project_title") == "TEST_SharePkg"
        assert isinstance(data.get("package"), dict)
        assert data["package"]["one_liner"].startswith("A test project")
        assert data["package"]["handoff_prompt"] == "Continue the AI Memory project."
        assert "handoff_prompt" in data["markdown"].lower() or "handoff" in data["markdown"].lower()

    def test_public_get_bad_share_id_404(self, anon_client):
        r = anon_client.get(f"{API}/public/memory/definitely-not-a-share-abc")
        assert r.status_code == 404

    def test_ownership_share_isolated(self, client_b, owned_pkg):
        """User B cannot create/delete a share on User A's package."""
        r = client_b.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 404
        r2 = client_b.delete(f"{API}/memory/{owned_pkg['id']}/share")
        assert r2.status_code == 404
        # And the existing share_id must still be intact (public GET still works)
        r3 = requests.get(f"{API}/public/memory/{TestPublicShare._share_id_1}")
        assert r3.status_code == 200

    def test_revoke_share_makes_public_get_404(self, client_a, owned_pkg):
        r = client_a.delete(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 200
        # Public link is now dead
        r2 = requests.get(f"{API}/public/memory/{TestPublicShare._share_id_1}")
        assert r2.status_code == 404
        # And package no longer carries share_id
        r3 = client_a.get(f"{API}/memory/{owned_pkg['id']}")
        assert r3.status_code == 200
        assert r3.json().get("share_id") in (None, "")

    def test_reshare_generates_new_or_same_style(self, client_a, owned_pkg):
        """After revoke, share creates a fresh share_id and it becomes idempotent again."""
        r = client_a.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r.status_code == 200
        new_id = r.json()["share_id"]
        # Must be a valid non-empty share_id — could differ from the revoked one
        assert isinstance(new_id, str) and len(new_id) >= 6
        # Idempotent again
        r2 = client_a.post(f"{API}/memory/{owned_pkg['id']}/share")
        assert r2.json()["share_id"] == new_id
        # Public GET works with the new id
        r3 = requests.get(f"{API}/public/memory/{new_id}")
        assert r3.status_code == 200
        assert "user_id" not in r3.json()
