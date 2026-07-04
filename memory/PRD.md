# AI Memory — PRD

## Original Problem Statement
Build a production-grade web app "AI Memory": an AI project-memory engine (NOT a summarizer).
Users paste an AI conversation transcript; the app generates a structured, paste-ready memory
package so full project context can move between AI systems (Claude → ChatGPT → Gemini, etc.).
Must feel like a serious developer tool with a premium SaaS UI (Notion/Linear/Vercel quality),
dark + light mode, responsive. First deliver a complete product/architecture plan, then build V1.

## User Choices (V1)
- LLM engine: **Claude Sonnet 4.6** (via Emergent Universal Key)
- Auth: **Emergent-managed Google OAuth** (httpOnly session cookie, 7-day)
- Persistence: **Yes** — saved packages + history/dashboard
- Output: **Structured Markdown + JSON export**
- Design: **Dark-first developer-tool aesthetic** (JetBrains Mono + Inter)

## Architecture
- Frontend: React 19 + Tailwind + Shadcn UI + framer-motion (CRA/craco, `@/` alias).
- Backend: FastAPI + Motor (async Mongo), emergentintegrations LlmChat (claude-sonnet-4-6).
- DB collections: `users`, `user_sessions`, `memory_packages`.
- All API routes under `/api`. Auth: cookie first, `Authorization: Bearer` fallback.
- Full plan: see `/app/memory/PRODUCT_ARCHITECTURE.md` (10 sections).

## User Personas
Developers, startup founders, students, product builders, designers, researchers, AI power users.

## Core Requirements (static)
- Paste transcript → generate structured memory package (goal, current state, completed/pending
  work, architecture decisions, constraints, key components, open questions, next tasks, handoff
  prompt tailored to target AI).
- Copy Markdown / Copy JSON / download .md / .json.
- Google login; per-user saved history; open/delete past packages.
- Dark/light theme; responsive.

## Implemented (2026-07-04)
- ✅ Landing (hero, before/after, features, how-it-works, use cases, CTA, footer) + Navbar/Footer.
- ✅ Emergent Google OAuth (session cookie + Bearer fallback), ProtectedRoute, AuthCallback.
- ✅ Workspace: transcript + source/target AI + title → Claude Sonnet 4.6 generation (auto-saved).
- ✅ MemoryPackageViewer with structured sections, handoff prompt, copy + Markdown/JSON export.
- ✅ Dashboard history sidebar: list, open, delete, new memory; theme toggle; logout.
- ✅ Backend CRUD: /api/memory generate/list/get/delete with ownership isolation.
- ✅ Tested: 16/16 backend pytest pass; full frontend auth-gated flow verified in browser.

## Implemented (2026-07-04, update 2)
- ✅ **Direct AI Connection**: send a memory package straight into ChatGPT/Claude/Gemini via a live
  handoff chat. Multi-turn, context-retaining. Built-in engine credits OR bring-your-own-key (BYOK,
  routed directly to the provider, never stored). Endpoints: POST /api/memory/{id}/handoff,
  POST /api/handoff/{id}/message, GET /api/memory/{id}/handoffs, GET /api/handoff/{id}. New
  `handoff_chats` collection. Frontend: HandoffPanel dialog in the package viewer.
- ✅ Portfolio README.md with banner, architecture, API table, setup, roadmap.

## Prioritized Backlog
- **P1:** Streaming generation UI (token-by-token); transcript chunking for very long threads.
- **P1:** Public share links (read-only) for a memory package.
- **P2:** Package versioning / diff between snapshots; templates per project type.
- **P2:** Team workspaces; usage analytics; API access; billing.
- **P2:** Browser extension for one-click export from Claude/ChatGPT.

## Next Tasks
1. Add streaming SSE generation with live section reveal.
2. Add share-link endpoint + public read-only viewer route.
3. Add search/filter over history.
