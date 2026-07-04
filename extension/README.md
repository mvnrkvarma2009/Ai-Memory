# AI Memory — One-Click Capture (Browser Extension)

Capture the conversation from any AI chat (ChatGPT, Claude, Gemini) and send it
straight into **AI Memory** to build a portable memory package — no copy/paste.

## How it works
1. Click the extension icon while on an AI chat page.
2. Click **Capture & open AI Memory** — it scrapes the conversation text.
3. AI Memory opens with the transcript **pre-filled** in the Workspace, ready to generate.

## Install (Load Unpacked)
1. Open `chrome://extensions` (or `edge://extensions`).
2. Enable **Developer mode** (top-right).
3. Click **Load unpacked** and select this `extension/` folder.
4. Pin the extension and open any of: `chatgpt.com`, `claude.ai`, `gemini.google.com`.

## Configure
- Edit `APP_URL` in `popup.js` to point to your deployed AI Memory URL.
- Update the app domain in `manifest.json` under `host_permissions` and
  `content_scripts.matches` (currently `https://*.preview.emergentagent.com/*`).

## Files
- `manifest.json` — MV3 config, permissions, content script matches.
- `popup.html` / `popup.js` — capture UI + transcript scraping and tab open.
- `app-inject.js` — content script on the app domain that passes the transcript
  to the page via `localStorage` (`aiMemoryPrefill`) and dispatches an
  `ai-memory-prefill` event the Workspace listens for.

> Note: chat sites change their DOM often; `popup.js` falls back to full-page text
> if site-specific selectors miss, so capture stays resilient.
