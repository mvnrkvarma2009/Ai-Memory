# 🚀 Deploying AI Memory to Vercel

This guide walks you through hosting AI Memory (Next.js + MongoDB) on **Vercel**.
Estimated time: **~15 minutes**.

---

## Prerequisites

| # | Service | Why | Cost |
|---|---------|-----|------|
| 1 | [Vercel](https://vercel.com) account | Hosting the Next.js app | Free (Hobby) tier is fine |
| 2 | [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster | Database (Vercel can't run local Mongo) | Free (M0 shared) tier is fine |
| 3 | An Emergent LLM key **with budget** | Powers the Memory Engine | Charged per token |

---

## Step 1 — Set up MongoDB Atlas

1. Go to <https://www.mongodb.com/cloud/atlas> and create a free **M0 shared cluster**.
2. **Database Access** → create a DB user (e.g. `ai_memory_app`) with a strong password.
3. **Network Access** → add `0.0.0.0/0` (allow all IPs) — required because Vercel serverless functions use rotating IPs.
4. **Connect** → **Drivers** → Node.js → copy the URI. It looks like:
   ```
   mongodb+srv://ai_memory_app:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
   → replace `<password>` with the actual password.

---

## Step 2 — Import the repo on Vercel

1. Push your code to GitHub (if not already done).
2. Go to <https://vercel.com/new> → **Import** your GitHub repo.
3. Framework preset: **Next.js** (auto-detected).
4. Build & Output settings: leave defaults — `next build`, `.next` output.
5. **DO NOT click Deploy yet** — first, set the environment variables (Step 3).

---

## Step 3 — Environment variables

Inside the Vercel project **Settings → Environment Variables**, add these for **Production**, **Preview**, and **Development**:

| Name | Value | Notes |
|---|---|---|
| `MONGO_URL` | your Atlas URI from Step 1 | e.g. `mongodb+srv://user:pass@cluster0.xxxxx.mongodb.net` |
| `DB_NAME` | `ai_memory` | Any name; will be created on first write. |
| `CORS_ORIGINS` | `*` | Or restrict to your Vercel domain. |
| `EMERGENT_LLM_KEY` | `sk-emergent-...` | Must have budget. See Emergent dashboard → Account → Universal Key. |
| `NEXT_PUBLIC_BASE_URL` | `https://<your-project>.vercel.app` | Fill in **after** first deploy — see Step 5. |

Check the box **“Automatically expose System Environment Variables”** so `VERCEL_URL` is available (optional).

---

## Step 4 — First deploy

Click **Deploy**. Vercel will:
1. `yarn install`
2. `next build`
3. Publish at `https://<your-project>.vercel.app`

The landing page should render immediately. Sign-in and the Generate button will not work yet — continue to Step 5.

---

## Step 5 — Wire the OAuth redirect

### 5a. Update `NEXT_PUBLIC_BASE_URL`
1. Copy your live Vercel URL (`https://<your-project>.vercel.app`).
2. Vercel → **Settings → Environment Variables** → edit `NEXT_PUBLIC_BASE_URL` → paste the URL.
3. **Redeploy** (Vercel → Deployments → pick latest → Redeploy).

### 5b. Whitelist the redirect URL with the OAuth broker ⚠️  IMPORTANT

AI Memory uses **Emergent’s Google OAuth broker** at `https://auth.emergentagent.com`. This broker was designed for Emergent-hosted apps and may **reject redirects to non-Emergent domains**.

If sign-in on Vercel fails with an error like *“invalid redirect”* or an empty callback, you have three options:

1. **Ask Emergent support** to allow-list your Vercel domain in their OAuth broker.
2. **Keep Emergent as the primary deploy** and use Vercel as a static/backup mirror.
3. **Replace the OAuth flow** with your own Google OAuth client (see `docs/AUTH_MIGRATION.md` — not included yet; ping the maintainer if you need it).

Everything **except sign-in** (landing page, `/api/*` routes, MongoDB, LLM generation) will work on Vercel out of the box.

---

## Step 6 — Verify

1. Visit your Vercel URL — the landing page should render.
2. Open a browser devtools **Network** tab and click **Get Started** → confirm the browser hits `auth.emergentagent.com`.
3. Complete sign-in (assuming the broker allows the redirect) → you should land on `/dashboard`.
4. Paste a long conversation and click **Generate Memory Package** — you should get a structured package back within ~30 s.

---

## Troubleshooting

### “Function execution timed out after 10s”
- You're on Vercel Hobby (free) tier which caps at 10s. LLM generation can take 20-60s.
- **Fix**: upgrade to Pro (`maxDuration: 60` in `vercel.json` is already set for you) OR run the LLM call in a Vercel Edge Function background job (out of scope for this guide).

### “MongoServerError: bad auth”
- Your Atlas password contains a special character that needs URL-encoding. Wrap it with `encodeURIComponent(...)` mentally: e.g. `@` → `%40`, `#` → `%23`.

### “Session expired” loop
- The cookie is set with `sameSite=none; secure`. Vercel serves HTTPS by default, so this should just work. If it doesn't, verify the browser accepts third-party cookies for the Vercel domain.

### “Budget has been exceeded! Current cost: 0.0, Max budget: 0.0”
- Your `EMERGENT_LLM_KEY` has no budget attached. Log into your Emergent dashboard → Account → Universal Key → add credits/budget.

---

## What Vercel gets you

- **Auto-deploy** on every `git push` to `main`
- **Preview deployments** for every PR
- **Global CDN** (edge cached static content)
- **Automatic HTTPS**
- **Zero-config Next.js optimization** — image optimization, ISR, streaming, etc.

---

## Alternative: skip OAuth issue by hosting on Emergent

If the OAuth broker redirect issue turns into a blocker, remember your app is **already fully working on Emergent**. Use Emergent for the live app and Vercel as a public GitHub-linked mirror.
