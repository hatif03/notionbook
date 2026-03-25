document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleToolbar");
  const loadBtn = document.getElementById("loadMockups");
  const statusEl = document.getElementById("status");
  const apiUrlInput = document.getElementById("apiUrl");
  const extensionApiKeyInput = document.getElementById("extensionApiKey");
  const llmProviderSelect = document.getElementById("llmProvider");
  const llmApiKeyInput = document.getElementById("llmApiKey");
  const llmModelInput = document.getElementById("llmModel");

  const { apiUrl, extensionApiKey, llmProvider, llmApiKey, llmModel } =
    await chrome.storage.local.get([
      "apiUrl",
      "extensionApiKey",
      "llmProvider",
      "llmApiKey",
      "llmModel",
    ]);
  if (apiUrl) {
    apiUrlInput.value = apiUrl;
  } else {
    apiUrlInput.value = "http://localhost:3001";
  }
  if (extensionApiKey) extensionApiKeyInput.value = extensionApiKey;
  if (llmProvider) llmProviderSelect.value = llmProvider;
  if (llmApiKey) llmApiKeyInput.value = llmApiKey;
  if (llmModel) llmModelInput.value = llmModel;

  async function refreshNotionLine() {
    const base = (apiUrlInput.value || "http://localhost:3001").replace(/\/$/, "");
    const headers = {};
    if (extensionApiKeyInput.value) headers["X-API-Key"] = extensionApiKeyInput.value;
    try {
      const r = await fetch(`${base}/api/notion/status`, { headers });
      const j = await r.json();
      return j.connected ? "Notion: connected" : "Notion: not connected";
    } catch {
      return "Notion: (server unreachable)";
    }
  }

  async function setDefaultStatus() {
    const notion = await refreshNotionLine();
    statusEl.textContent = `Ready — ${notion}`;
  }

  await setDefaultStatus();

  apiUrlInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ apiUrl: apiUrlInput.value });
    statusEl.textContent = "API URL saved";
    statusEl.classList.add("active");
    setTimeout(() => {
      void setDefaultStatus();
      statusEl.classList.remove("active");
    }, 2000);
  });

  extensionApiKeyInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ extensionApiKey: extensionApiKeyInput.value });
    statusEl.textContent = "API key saved";
    statusEl.classList.add("active");
    setTimeout(() => {
      void setDefaultStatus();
      statusEl.classList.remove("active");
    }, 2000);
  });

  llmProviderSelect.addEventListener("change", async () => {
    await chrome.storage.local.set({ llmProvider: llmProviderSelect.value });
    statusEl.textContent = "Provider saved";
    statusEl.classList.add("active");
    setTimeout(() => {
      void setDefaultStatus();
      statusEl.classList.remove("active");
    }, 1500);
  });

  llmApiKeyInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ llmApiKey: llmApiKeyInput.value });
    statusEl.textContent = "LLM key saved (local only)";
    statusEl.classList.add("active");
    setTimeout(() => {
      void setDefaultStatus();
      statusEl.classList.remove("active");
    }, 2000);
  });

  llmModelInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ llmModel: llmModelInput.value });
    statusEl.textContent = "Model saved";
    statusEl.classList.add("active");
    setTimeout(() => {
      void setDefaultStatus();
      statusEl.classList.remove("active");
    }, 1500);
  });

  toggleBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        statusEl.textContent = "❌ No active tab";
        return;
      }

      // Get the API URL
      const { apiUrl } = await chrome.storage.local.get("apiUrl");
      const url = apiUrl || "http://localhost:3001";
      
      // Send message to content script
      await chrome.tabs.sendMessage(tab.id, { 
        type: "PM_TOGGLE_TOOLBAR", 
        apiUrl: url 
      });
      
      window.close();
    } catch (error) {
      console.error("Error:", error);
      statusEl.textContent = "❌ Refresh page & retry";
    }
  });

  loadBtn.addEventListener("click", async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab || !tab.id) {
        statusEl.textContent = "❌ No active tab";
        return;
      }
      
      await chrome.tabs.sendMessage(tab.id, { type: "PM_LOAD_MOCKUPS" });
      
      statusEl.textContent = "✓ Mockups loaded";
      statusEl.classList.add("active");
      setTimeout(() => {
        statusEl.textContent = "Ready to prototype";
        statusEl.classList.remove("active");
      }, 2000);
    } catch (error) {
      console.error("Error:", error);
      statusEl.textContent = "❌ Refresh page & retry";
    }
  });
});
