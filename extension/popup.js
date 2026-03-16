/** Build apiKeys object for request body - only include non-empty keys */
async function getApiKeysForRequest() {
  const { apiKeys } = await chrome.storage.local.get("apiKeys");
  if (!apiKeys || typeof apiKeys !== "object") return undefined;
  const out = {};
  if (typeof apiKeys.anthropic === "string" && apiKeys.anthropic.trim()) out.anthropic = apiKeys.anthropic.trim();
  if (typeof apiKeys.google === "string" && apiKeys.google.trim()) out.google = apiKeys.google.trim();
  if (typeof apiKeys.groq === "string" && apiKeys.groq.trim()) out.groq = apiKeys.groq.trim();
  return Object.keys(out).length ? out : undefined;
}

document.addEventListener("DOMContentLoaded", async () => {
  const connectNotionBtn = document.getElementById("connectNotionBtn");
  const connectNotion = document.getElementById("connectNotion");
  const saveTabsBtn = document.getElementById("saveTabs");
  const searchNotionBtn = document.getElementById("searchNotion");
  const captureToNotionBtn = document.getElementById("captureToNotion");
  const toggleBtn = document.getElementById("toggleToolbar");
  const loadBtn = document.getElementById("loadMockups");
  const statusEl = document.getElementById("status");
  const statusSettingsEl = document.getElementById("statusSettings");
  const apiUrlInput = document.getElementById("apiUrl");
  const aiModelSelect = document.getElementById("aiModel");
  const apiKeyClaude = document.getElementById("apiKeyClaude");
  const apiKeyGemini = document.getElementById("apiKeyGemini");
  const apiKeyGroq = document.getElementById("apiKeyGroq");
  const saveApiKeysBtn = document.getElementById("saveApiKeys");
  const settingsBtn = document.getElementById("settingsBtn");
  const backBtn = document.getElementById("backBtn");
  const mainView = document.getElementById("mainView");
  const settingsView = document.getElementById("settingsView");

  const { apiUrl, aiModel, apiKeys } = await chrome.storage.local.get(["apiUrl", "aiModel", "apiKeys"]);
  apiUrlInput.value = apiUrl || "http://localhost:3001";
  aiModelSelect.value = aiModel || "claude";
  if (apiKeys) {
    apiKeyClaude.value = apiKeys.anthropic || "";
    apiKeyGemini.value = apiKeys.google || "";
    apiKeyGroq.value = apiKeys.groq || "";
  }

  settingsBtn.addEventListener("click", () => {
    mainView.classList.remove("active");
    settingsView.classList.add("active");
  });

  backBtn.addEventListener("click", () => {
    settingsView.classList.remove("active");
    mainView.classList.add("active");
  });

  function setStatusIn(el, msg, isSuccess = false) {
    el.textContent = msg;
    el.classList.remove("active", "error");
    if (isSuccess) el.classList.add("active");
    else if (msg.startsWith("❌")) el.classList.add("error");
    setTimeout(() => {
      el.textContent = "Ready";
      el.classList.remove("active", "error");
    }, 3000);
  }

  apiUrlInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ apiUrl: apiUrlInput.value });
    setStatusIn(statusSettingsEl, "API URL saved", true);
  });

  aiModelSelect.addEventListener("change", async () => {
    await chrome.storage.local.set({ aiModel: aiModelSelect.value });
    setStatusIn(statusSettingsEl, "Model saved", true);
  });

  saveApiKeysBtn.addEventListener("click", async () => {
    const keys = {
      anthropic: (apiKeyClaude.value || "").trim(),
      google: (apiKeyGemini.value || "").trim(),
      groq: (apiKeyGroq.value || "").trim(),
    };
    await chrome.storage.local.set({ apiKeys: keys });
    setStatusIn(statusSettingsEl, "API keys saved", true);
  });

  async function getApiUrl() {
    const { apiUrl } = await chrome.storage.local.get("apiUrl");
    return apiUrl || "http://localhost:3001";
  }

  function setStatus(msg, isSuccess = false) {
    setStatusIn(statusEl, msg, isSuccess);
  }

  async function checkNotionStatus() {
    try {
      const base = await getApiUrl();
      const res = await fetch(`${base}/api/notion-status`);
      const data = await res.json();
      connectNotionBtn.style.display = data.connected ? "none" : "flex";
      connectNotion.style.display = data.connected ? "flex" : "none";
    } catch {
      connectNotionBtn.style.display = "flex";
      connectNotion.style.display = "none";
    }
  }

  connectNotionBtn.addEventListener("click", async () => {
    const base = await getApiUrl();
    chrome.tabs.create({ url: `${base}/auth/notion` });
    window.close();
  });

  saveTabsBtn.addEventListener("click", async () => {
    try {
      const base = await getApiUrl();
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tabData = tabs
        .filter((t) => t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("edge://"))
        .map((t) => ({ url: t.url, title: t.title || t.url }));

      if (tabData.length === 0) {
        setStatus("❌ No tabs to save");
        return;
      }

      setStatus("Saving...");
      const { aiModel } = await chrome.storage.local.get("aiModel");
      const apiKeys = await getApiKeysForRequest();
      const res = await fetch(`${base}/api/tabs-to-notion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabs: tabData, model: aiModel || "claude", apiKeys }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setStatus(`✓ Saved ${data.created || tabData.length} tabs`, true);
    } catch (e) {
      setStatus(`❌ ${e.message}`);
    }
  });

  searchNotionBtn.addEventListener("click", async () => {
    const query = prompt("Search Notion (and Slack, Jira, Drive):");
    if (!query) return;
    try {
      const base = await getApiUrl();
      setStatus("Searching...");
      const res = await fetch(`${base}/api/notion-search`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      alert(data.results || data.text || "No results");
      setStatus("Search complete", true);
    } catch (e) {
      setStatus(`❌ ${e.message}`);
    }
  });

  document.getElementById("researchSummary").addEventListener("click", async () => {
    try {
      const base = await getApiUrl();
      const tabs = await chrome.tabs.query({ currentWindow: true });
      const tabData = tabs
        .filter((t) => t.url && !t.url.startsWith("chrome://") && !t.url.startsWith("edge://"))
        .map((t) => ({ url: t.url, title: t.title || t.url }));
      if (tabData.length === 0) {
        setStatus("❌ No tabs to summarize");
        return;
      }
      setStatus("Creating summary...");
      const { aiModel } = await chrome.storage.local.get("aiModel");
      const apiKeys = await getApiKeysForRequest();
      const res = await fetch(`${base}/api/research-summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tabs: tabData, model: aiModel || "claude", apiKeys }),
      });
      const data = await res.json();
      if (res.ok) setStatus("✓ Summary saved to Notion", true);
      else setStatus(`❌ ${data.error || "Failed"}`);
    } catch (e) {
      setStatus(`❌ ${e.message}`);
    }
  });

  captureToNotionBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatus("❌ No active tab");
        return;
      }
      const url = tab.url || "";
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("chrome-extension://")) {
        setStatus("❌ Open a regular webpage first");
        return;
      }
      setStatus("Capturing...");
      const response = await chrome.tabs.sendMessage(tab.id, { type: "NB_CAPTURE_TO_NOTION" });
      if (response?.success) {
        setStatus("✓ Saved to Notion", true);
      } else {
        setStatus(`❌ ${response?.error || "Failed"}`);
      }
    } catch (e) {
      setStatus("❌ Refresh the page & try again");
    }
  });

  toggleBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatus("❌ No active tab");
        return;
      }
      const url = tab.url || "";
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("chrome-extension://")) {
        setStatus("❌ Open a regular webpage first (browser pages don't support the toolbar)");
        return;
      }
      const apiUrl = await getApiUrl();
      await chrome.tabs.sendMessage(tab.id, { type: "PM_TOGGLE_TOOLBAR", apiUrl });
      window.close();
    } catch (e) {
      setStatus("❌ Refresh the page & try again");
    }
  });

  loadBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) {
        setStatus("❌ No active tab");
        return;
      }
      const url = tab.url || "";
      if (url.startsWith("chrome://") || url.startsWith("edge://") || url.startsWith("about:") || url.startsWith("chrome-extension://")) {
        setStatus("❌ Open a regular webpage first");
        return;
      }
      await chrome.tabs.sendMessage(tab.id, { type: "PM_LOAD_MOCKUPS" });
      setStatus("✓ Mockups loaded", true);
    } catch (e) {
      setStatus("❌ Refresh the page & try again");
    }
  });

  checkNotionStatus();
});
