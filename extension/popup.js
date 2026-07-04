// AI Memory browser extension — popup logic.
// NOTE: Set APP_URL to your deployed AI Memory URL before packaging the extension.
// The default below points at a preview build; replace it with your own domain
// (e.g. "https://ai-memory.your-domain.com") when you host the app yourself.
const APP_URL = "https://memory-engine-19.preview.emergentagent.com";

// Runs in the context of the active AI tab to extract the conversation text.
function grabTranscript() {
  const selectors = {
    "chatgpt.com": "[data-message-author-role]",
    "chat.openai.com": "[data-message-author-role]",
    "claude.ai": "[data-testid='conversation-turn'], [data-test-render-count]",
    "gemini.google.com": "message-content, .conversation-container",
  };
  const host = location.hostname;
  const key = Object.keys(selectors).find((k) => host.includes(k));
  let text = "";
  if (key) {
    const nodes = document.querySelectorAll(selectors[key]);
    if (nodes && nodes.length) {
      text = Array.from(nodes)
        .map((n) => (n.innerText || "").trim())
        .filter(Boolean)
        .join("\n\n");
    }
  }
  if (!text || text.trim().length < 40) {
    text = document.body ? document.body.innerText : "";
  }
  return (text || "").trim().slice(0, 60000);
}

const statusEl = document.getElementById("status");
const btn = document.getElementById("capture");

btn.addEventListener("click", async () => {
  btn.disabled = true;
  statusEl.textContent = "Capturing conversation…";
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: grabTranscript,
    });
    const result = results && results[0] ? results[0].result : "";
    if (!result || result.trim().length < 40) {
      statusEl.textContent = "No conversation text found on this page.";
      btn.disabled = false;
      return;
    }
    await chrome.storage.local.set({ aiMemoryCapture: result });
    await chrome.tabs.create({ url: APP_URL + "/dashboard" });
    window.close();
  } catch (e) {
    statusEl.textContent = "Capture failed: " + (e && e.message ? e.message : String(e));
    btn.disabled = false;
  }
});
