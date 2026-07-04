"""End-to-end backend API tests for Direct AI Connection (handoff) feature.

Covers:
- POST /api/memory/{id}/handoff  — happy path (built-in engine, byok=false, 2 seed msgs)
- POST /api/handoff/{id}/message — appends user+assistant pair, context-aware
- Validation: invalid provider (400), empty message content (400), auth required (401)
- GET  /api/memory/{id}/handoffs — lists user's chats for that package, most recent first
- GET  /api/handoff/{id}         — returns chat; 404 for unknown
- Ownership isolation — User B cannot start handoff on User A's package (404), nor read/message A's chat (404)
- Cascade delete — deleting the memory package removes its handoff_chats

NOTE: All state-sharing tests live inside a single class so pytest-xdist `--dist loadscope`
keeps them on the same worker (workers do NOT share Python module-level state).
"""
import requests
from .conftest import API


# --------- Handoff full flow (single class → single xdist worker) ---------

class TestHandoffFlow:
    # Class-level state shared across ordered test methods
    pkg_id: str = ""
    chat_id: str = ""

    # ---- Setup: generate a package for User A (one LLM call, reused) ----
    def test_00_setup_generate_package(self, session_a, sample_transcript):
        s = requests.Session()
        s.headers.update({
            "Content-Type": "application/json",
            "Authorization": f"Bearer {session_a['token']}",
        })
        r = s.post(
            f"{API}/memory/generate",
            json={
                "transcript": sample_transcript,
                "source_ai": "Claude",
                "target_ai": "ChatGPT",
                "project_title": "FlowBoard-Handoff",
            },
            timeout=120,
        )
        assert r.status_code == 200, f"generate failed: {r.status_code} {r.text[:400]}"
        TestHandoffFlow.pkg_id = r.json()["id"]
        assert TestHandoffFlow.pkg_id

    # ---- Handoff start ----
    def test_01_start_happy_path_openai(self, client_a):
        r = client_a.post(
            f"{API}/memory/{TestHandoffFlow.pkg_id}/handoff",
            json={"provider": "openai", "model": "gpt-4o"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        chat = r.json()
        for f in ("id", "user_id", "package_id", "project_title", "provider",
                  "model", "byok", "messages", "created_at", "updated_at"):
            assert f in chat, f"missing {f}"
        assert "_id" not in chat
        assert chat["package_id"] == TestHandoffFlow.pkg_id
        assert chat["provider"] == "openai"
        assert chat["model"] == "gpt-4o"
        assert chat["byok"] is False  # built-in engine (no api_key sent)
        assert len(chat["messages"]) == 2
        assert chat["messages"][0]["role"] == "user"
        assert chat["messages"][0]["seed"] is True
        assert chat["messages"][1]["role"] == "assistant"
        assert chat["messages"][1]["seed"] is False
        assert len(chat["messages"][1]["content"].strip()) > 30
        TestHandoffFlow.chat_id = chat["id"]

    def test_02_start_invalid_provider_returns_400(self, client_a):
        r = client_a.post(
            f"{API}/memory/{TestHandoffFlow.pkg_id}/handoff",
            json={"provider": "foo", "model": "whatever"},
            timeout=30,
        )
        assert r.status_code == 400, r.text

    def test_03_start_unknown_package_returns_404(self, client_a):
        r = client_a.post(
            f"{API}/memory/no-such-pkg-id-xyz/handoff",
            json={"provider": "openai", "model": "gpt-4o"},
            timeout=30,
        )
        assert r.status_code == 404

    def test_04_start_requires_auth(self, anon_client):
        r = anon_client.post(
            f"{API}/memory/{TestHandoffFlow.pkg_id}/handoff",
            json={"provider": "openai", "model": "gpt-4o"},
            timeout=30,
        )
        assert r.status_code == 401

    # ---- Handoff follow-up message ----
    def test_10_follow_up_message_appends_pair(self, client_a):
        assert TestHandoffFlow.chat_id, "no chat_id from start test"
        r0 = client_a.get(f"{API}/handoff/{TestHandoffFlow.chat_id}")
        assert r0.status_code == 200
        before = len(r0.json()["messages"])

        r = client_a.post(
            f"{API}/handoff/{TestHandoffFlow.chat_id}/message",
            json={"content": "What is the FIRST concrete file/route I should implement next for FlowBoard, and why?"},
            timeout=90,
        )
        assert r.status_code == 200, r.text
        chat = r.json()
        assert len(chat["messages"]) == before + 2
        assert chat["messages"][-2]["role"] == "user"
        assert chat["messages"][-1]["role"] == "assistant"
        assert chat["messages"][-1]["seed"] is False
        reply = chat["messages"][-1]["content"].lower()
        keywords = ["flowboard", "auth", "jwt", "fastapi", "task", "/auth", "login", "refresh"]
        assert any(k in reply for k in keywords), f"Reply not context-aware: {reply[:400]}"

    def test_11_empty_content_returns_400(self, client_a):
        assert TestHandoffFlow.chat_id
        r = client_a.post(
            f"{API}/handoff/{TestHandoffFlow.chat_id}/message",
            json={"content": "   "},
            timeout=30,
        )
        assert r.status_code == 400
        r2 = client_a.post(
            f"{API}/handoff/{TestHandoffFlow.chat_id}/message",
            json={"content": ""},
            timeout=30,
        )
        assert r2.status_code == 400

    def test_12_message_to_unknown_chat_returns_404(self, client_a):
        r = client_a.post(
            f"{API}/handoff/no-such-chat-id/message",
            json={"content": "hi"},
            timeout=30,
        )
        assert r.status_code == 404

    # ---- List / get ----
    def test_20_list_returns_chat(self, client_a):
        r = client_a.get(f"{API}/memory/{TestHandoffFlow.pkg_id}/handoffs")
        assert r.status_code == 200
        arr = r.json()
        assert isinstance(arr, list) and len(arr) >= 1
        ids = [c["id"] for c in arr]
        assert TestHandoffFlow.chat_id in ids
        for c in arr:
            assert "_id" not in c

    def test_21_list_sorted_desc_by_updated_at(self, client_a):
        r = client_a.get(f"{API}/memory/{TestHandoffFlow.pkg_id}/handoffs")
        assert r.status_code == 200
        arr = r.json()
        ts = [c["updated_at"] for c in arr]
        assert ts == sorted(ts, reverse=True)

    def test_22_get_chat_by_id(self, client_a):
        r = client_a.get(f"{API}/handoff/{TestHandoffFlow.chat_id}")
        assert r.status_code == 200
        assert r.json()["id"] == TestHandoffFlow.chat_id

    def test_23_get_unknown_chat_returns_404(self, client_a):
        r = client_a.get(f"{API}/handoff/definitely-not-a-real-chat-id")
        assert r.status_code == 404

    # ---- Ownership isolation ----
    def test_30_user_b_cannot_start_handoff_on_user_a_package(self, client_b):
        r = client_b.post(
            f"{API}/memory/{TestHandoffFlow.pkg_id}/handoff",
            json={"provider": "openai", "model": "gpt-4o"},
            timeout=30,
        )
        assert r.status_code == 404

    def test_31_user_b_cannot_read_user_a_chat(self, client_b):
        r = client_b.get(f"{API}/handoff/{TestHandoffFlow.chat_id}")
        assert r.status_code == 404

    def test_32_user_b_cannot_message_user_a_chat(self, client_b):
        r = client_b.post(
            f"{API}/handoff/{TestHandoffFlow.chat_id}/message",
            json={"content": "hi"},
            timeout=30,
        )
        assert r.status_code == 404

    def test_33_user_b_list_for_user_a_package_is_empty(self, client_b):
        # Endpoint filters by user_id (no 404 on the pkg lookup) → should return [].
        r = client_b.get(f"{API}/memory/{TestHandoffFlow.pkg_id}/handoffs")
        assert r.status_code == 200
        assert r.json() == []

    # ---- Cascade delete (runs LAST) ----
    def test_90_delete_package_cascades_handoff_chats(self, client_a, mongo_db):
        pre = mongo_db.handoff_chats.count_documents({"package_id": TestHandoffFlow.pkg_id})
        assert pre >= 1
        r = client_a.delete(f"{API}/memory/{TestHandoffFlow.pkg_id}")
        assert r.status_code == 200
        r2 = client_a.get(f"{API}/memory/{TestHandoffFlow.pkg_id}")
        assert r2.status_code == 404
        post = mongo_db.handoff_chats.count_documents({"package_id": TestHandoffFlow.pkg_id})
        assert post == 0
        # Chat also unreadable via API now
        r3 = client_a.get(f"{API}/handoff/{TestHandoffFlow.chat_id}")
        assert r3.status_code == 404
