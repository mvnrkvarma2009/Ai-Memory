// Injected on the AI Memory app domain. Reads a captured transcript from
// extension storage, hands it to the app via localStorage, then pings the page.
(function () {
  try {
    chrome.storage.local.get("aiMemoryCapture", (r) => {
      const text = r && r.aiMemoryCapture;
      if (!text) return;
      try {
        localStorage.setItem("aiMemoryPrefill", text);
      } catch (e) {
        /* ignore */
      }
      // localStorage is shared across worlds; this event just nudges the app to re-read it.
      document.documentElement.dispatchEvent(new CustomEvent("ai-memory-prefill"));
      chrome.storage.local.remove("aiMemoryCapture");
    });
  } catch (e) {
    /* extension context unavailable — ignore */
  }
})();
