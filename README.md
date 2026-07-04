# 🧠 AI Memory — The AI Project-Memory Engine

> Move a project's full context between AI systems. Never re-explain your work to a new AI again.

AI Memory turns a raw AI conversation (Claude, ChatGPT, Gemini, Cursor…) into a **structured, paste-ready memory package** so any other AI picks up exactly where you left off.

It is **not** a summarizer. It reconstructs the *working state* of a project: goal, current state, completed & pending work, architecture decisions, constraints, key components, open questions and the ordered next tasks.

---

## ✨ Features

- **Memory Engine (Claude Sonnet 4.5)** — extracts real project state into 11 structured sections, not a lossy TL;DR.
- **Target-tuned handoff prompt** — a ready-to-paste opener written for whichever AI you're moving to.
- **Markdown + JSON export** — copy paste-ready markdown or export structured JSON.
- **Per-user history** — every package is saved to your account.
- **Public share links** — read-only shareable URL for any memory package.
- **Google sign-in** — secure session auth via Emergent auth.
- **Premium dark-first UI** — Swiss/high-contrast developer-tool aesthetic.

---

## 🖥️ Tech Stack

| Layer      | Tech |
|------------|------|
| Framework  | **Next.js 15.5 (App Router)** — single deploy, no separate backend |
| Frontend   | React 18, Tailwind CSS, shadcn/ui, framer-motion, lucide-react |
| Backend    | Next.js API routes (`/app/api/[[...path]]/route.js`) |
| AI         | Claude Sonnet 4.5 via the Emergent Universal LLM key (OpenAI-compatible proxy) |
| Auth       | Google OAuth via `auth.emergentagent.com` + httpOnly session cookies (7-day) |
| Database   | MongoDB (`users`, `user_sessions`, `memory_packages`) |

---

## 🏗️ Architecture

```
React SPA (Next.js App Router)  ──▶  /api/*  ──▶  MongoDB
                                       │
                                       └──▶  Emergent LLM proxy (Anthropic Claude)
```

All backend routes are prefixed with `/api` and handled by a single catch-all: `app/api/[[...path]]/route.js`.

### Core API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/api/auth/session` | Exchange OAuth `session_id` → session cookie |
| `GET`  | `/api/auth/me` | Current user |
| `POST` | `/api/auth/logout` | Clear session |
| `POST` | `/api/memory/generate` | Generate + save a memory package |
| `GET`  | `/api/memory` | List the user's packages |
| `GET`  | `/api/memory/:id` | Get one package |
| `DELETE` | `/api/memory/:id` | Delete a package |
| `POST` | `/api/memory/:id/share` | Create / return a public share link |
| `DELETE` | `/api/memory/:id/share` | Revoke public share |
| `GET`  | `/api/public/memory/:shareId` | Read-only view of a shared package |

---

## ⚙️ Local Setup

**Prerequisites:** Node ≥ 18, Yarn, MongoDB.

```bash
git clone <your-repo-url>
cd ai-memory
cp .env.example .env      # fill in MONGO_URL + EMERGENT_LLM_KEY
yarn install
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deploy

- **Emergent** — click **Publish to GitHub** and **Deploy**. The app runs as a single Next.js service.
- **Vercel** — connect the GitHub repo, set env vars, deploy.
- **MongoDB Atlas** — recommended for production `MONGO_URL`.

---

## 📄 License

MIT — see [LICENSE](LICENSE).

<p align="center"><em>Built by <strong>Nagendra Varma Mudunuri</strong> · Next.js · MongoDB · Claude Sonnet 4.5</em></p>
