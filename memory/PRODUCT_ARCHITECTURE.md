# AI Memory — Product Architecture (V1)

> AI Memory is an **AI project-memory engine**. It converts a raw AI conversation
> into a structured, paste-ready **memory package** so a project's full context can
> move losslessly between AI systems (Claude → ChatGPT → Gemini, etc.).
> It is explicitly **not** a summarizer — it captures *state*, *decisions*, and *next actions*.

---

## 1. Product Architecture
- **Frontend (React + Tailwind):** Landing (marketing) + Authenticated App (Workspace + History).
- **Backend (FastAPI):** Auth service, Memory Engine service, Package persistence.
- **AI Layer:** Claude Sonnet 4.6 via Emergent Universal Key. Deterministic JSON schema output.
- **Data (MongoDB):** users, user_sessions, memory_packages.
- **Auth:** Emergent-managed Google OAuth (httpOnly session cookie, 7-day expiry).

## 2. User Flow
1. Visitor lands on marketing page → understands the "context loss" problem.
2. Clicks **Get Started** → Google login → redirected to `/dashboard`.
3. In the **Workspace**, pastes a conversation, picks **Source AI** + **Target AI**.
4. Clicks **Generate Memory Package** → engine returns structured sections.
5. Views the package, **copies markdown** / **exports JSON**, pastes into the new AI.
6. Package auto-saved → visible in **History** for later reuse.

## 3. Information Architecture
```
/                     Landing (Hero, Features, How-it-works, Footer) — public
/login                Google login — public
/dashboard            App shell (Workspace + History sidebar) — protected
/dashboard/:id        Open a saved package — protected
```

## 4. Database Design (future-ready)
- **users**: `user_id (uuid)`, `email (unique)`, `name`, `picture`, `created_at`
- **user_sessions**: `user_id`, `session_token`, `expires_at`, `created_at`
- **memory_packages**: `id (uuid)`, `user_id`, `project_title`, `source_ai`, `target_ai`,
  `package{}` (structured sections), `markdown`, `created_at`
- *Future tables:* `teams`, `shares` (public links), `templates`, `usage_events`, `api_keys`.

## 5. Component Structure (frontend)
- `context/AuthContext`, `components/ThemeProvider`, `components/ThemeToggle`
- `components/Navbar`, `components/Footer`, `components/ProtectedRoute`
- `pages/Landing`, `pages/Login`, `pages/AuthCallback`, `pages/Dashboard`
- `components/Workspace`, `components/MemoryPackageViewer`, `components/HistorySidebar`

## 6. AI Memory Engine Design
- Strong system prompt instructing Claude to act as a *context-extraction engine*.
- Output is **strict JSON** with fixed sections:
  `one_liner, project_goal, current_state, tech_stack[], completed_work[],
   pending_work[], architecture_decisions[], constraints[], key_components[],
   open_questions[], next_tasks[], handoff_prompt`.
- Backend validates/parses JSON, renders canonical **Markdown**, stores both.
- `handoff_prompt` = a ready-to-paste opener tuned for the chosen **Target AI**.

## 7. Scalability Plan
- Stateless FastAPI (horizontally scalable behind ingress).
- Mongo indexes on `user_id`, `email`, `session_token`, `created_at`.
- LLM calls are per-request; future: queue + streaming for very long transcripts.
- Chunking strategy for transcripts beyond model context (map-reduce merge).

## 8. Future Feature Expansion
- Streaming generation UI, transcript chunking for huge sessions.
- Public share links & team workspaces.
- Package versioning / diff between snapshots.
- Browser extension + "one-click export from Claude/ChatGPT".
- Templates per project type; API access; usage analytics; billing.

## 9. Technical Architecture
- React 19 (CRA + craco, `@/` alias), Tailwind, Shadcn UI, framer-motion, lucide-react.
- FastAPI + Motor (async Mongo), emergentintegrations (Claude Sonnet 4.6).
- All API routes under `/api`. Cookie auth + Bearer fallback.

## 10. UI Layout Plan
- **Theme:** Dark-first (Swiss / high-contrast), JetBrains Mono headings + Inter body.
- **Landing:** sticky glass navbar → hero with wire-mesh texture → problem/solution →
  feature grid → how-it-works (3 steps) → CTA → footer.
- **Dashboard:** top navbar (avatar, theme, logout) + left history sidebar + main pane
  (Workspace form or structured package viewer). Dense grid, 1px borders, rounded-sm.
