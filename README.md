# 🧠 AI Memory — The Project-Memory Engine

> **Move a project’s full context between AI systems. Never re-explain your work to a new AI again.**

AI Memory turns a raw conversation (Claude, ChatGPT, Gemini, Cursor…) into a **structured, paste-ready memory package** so any other AI picks up exactly where you left off.

It is **not** a summarizer. It reconstructs the *working state* of a project: goal, current state, completed & pending work, architecture decisions, constraints, key components, open questions, and the ordered next tasks.

**Live demo:** [ai-memory.netlify.app](https://ai-memory.netlify.app) &nbsp;·&nbsp; **License:** MIT &nbsp;·&nbsp; **No account required.**

---

## ✨ Features

- 🧠 **Memory Engine** — Google Gemini extracts real project state into 11 structured sections, not a lossy TL;DR.
- 🎯 **Target-tuned handoff prompt** — a ready-to-paste opener written for whichever AI you're moving to.
- 📄 **Markdown + JSON export** — copy paste-ready markdown or export structured JSON.
- 💾 **Local history** — every package is saved in your browser (localStorage). Zero server storage.
- 🔓 **No sign-up, no accounts, no tracking** — the only network call is to Gemini, and only when you press Generate.
- 🌙 **Dark-first premium UI** — Swiss/high-contrast developer-tool aesthetic.

---

## 🖥️ Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15.5 (App Router) |
| UI | React 18 · Tailwind CSS · shadcn/ui · framer-motion · lucide-react |
| API | Next.js route handlers (`app/api/[[...path]]/route.js`) |
| AI | Google Gemini via [`generativelanguage.googleapis.com`](https://ai.google.dev/) |
| Storage | Browser `localStorage` (no database, no backend state) |
| Hosting | Netlify (works on Vercel too) |

---

## 🚀 Deploy to Netlify (free)

1. **Push this repo to GitHub** (if you haven't already).
2. Go to [app.netlify.com/start](https://app.netlify.com/start) → **Import an existing project** → pick GitHub → pick this repo.
3. Framework preset: **Next.js** (auto-detected via `netlify.toml`).
4. Under **Environment variables**, add:
   | Name | Value |
   |------|-------|
   | `GEMINI_API_KEY` | Your Gemini key from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey) |
   | `GEMINI_MODEL` | *(optional)* e.g. `gemini-flash-latest` or `gemini-2.5-flash-lite` |
5. Click **Deploy**. Done in ~1 minute.

That's it. No database, no OAuth, no other services.

---

## 💻 Local Development

```bash
# Prerequisites: Node ≥ 18 and yarn
git clone <your-fork-url>
cd ai-memory

cp .env.example .env         # then paste your GEMINI_API_KEY
yarn install
yarn dev                     # http://localhost:3000
```

---

## 🔑 Getting a Free Gemini API Key

1. Visit [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)
2. Click **"Create API key"** → optionally create a new project
3. Copy the key (starts with `AIza…` or `AQ.…`)
4. Paste it into `.env` as `GEMINI_API_KEY=...`

Gemini's free tier is generous (thousands of requests per day on flash-lite models).

---

## 🏗️ How It Works

```
 ┌───────────────┐    paste conversation      ┌────────────────────┐
 │ React frontend  │  ───────────────────▶ │ Next.js API      │
 │ (Dashboard UI)  │  ◀──────── memory package ─│ /memory/generate │
 └───────┬────────┘                          └──────┬───────────┘
         │                                        │
         │ saves package                          │ REST call
         ▼                                        ▼
 ┌───────────────┐                        ┌────────────────────┐
 │ localStorage    │                        │ Google Gemini    │
 └───────────────┘                        └────────────────────┘
```

### API

| Method | Route | Description |
|--------|-------|-------------|
| `GET`  | `/api/health` | Health check |
| `POST` | `/api/memory/generate` | Generate a memory package from a transcript |

#### `POST /api/memory/generate`

**Request body**
```json
{
  "transcript": "User: ...\nAssistant: ...",
  "source_ai": "Claude",
  "target_ai": "ChatGPT",
  "project_title": "FlowBoard (optional)"
}
```

**Response**
```json
{
  "id": "uuid",
  "project_title": "FlowBoard",
  "source_ai": "Claude",
  "target_ai": "ChatGPT",
  "package": {
    "one_liner": "…",
    "project_goal": "…",
    "current_state": "…",
    "tech_stack": ["React", "Node.js", "…"],
    "completed_work": ["…"],
    "pending_work": ["…"],
    "architecture_decisions": ["…"],
    "constraints": ["…"],
    "key_components": ["…"],
    "open_questions": ["…"],
    "next_tasks": ["…"],
    "handoff_prompt": "…"
  },
  "markdown": "# 🧠 AI Memory Package — FlowBoard\n…",
  "created_at": "2026-01-15T10:00:00.000Z"
}
```

---

## 📁 Project Structure

```
ai-memory/
├── app/
│   ├── api/[[...path]]/route.js   ← Next.js catch-all API (only /memory/generate)
│   ├── dashboard/page.js         ← Workspace (paste → generate → view)
│   ├── layout.js                 ← Root layout (Theme + Toaster)
│   ├── page.js                   ← Landing page
│   └── globals.css
├── components/
│   ├── DashboardShell.jsx        ← History sidebar + main pane (localStorage)
│   ├── Workspace.jsx             ← Generate form
│   ├── MemoryPackageViewer.jsx   ← Structured display + copy/download
│   ├── Navbar.jsx · Footer.jsx · ThemeProvider.jsx · ThemeToggle.jsx
│   └── ui/                       ← shadcn components
├── lib/
│   ├── gemini.js                 ← Direct Gemini REST call (no SDK dep)
│   ├── api.js                    ← Axios client (baseURL '/api')
│   └── utils.js                  ← cn() helper
├── .env.example                  ← Only GEMINI_API_KEY needed
├── netlify.toml                  ← Netlify + @netlify/plugin-nextjs
├── package.json
├── LICENSE                       ← MIT
└── README.md
```

---

## 📝 License

MIT — see [`LICENSE`](./LICENSE).

<p align="center"><em>Built by <strong>Nagendra Varma Mudunuri</strong> · Next.js · Google Gemini · Netlify</em></p>
