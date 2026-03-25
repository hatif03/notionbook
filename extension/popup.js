document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleToolbar");
  const loadBtn = document.getElementById("loadMockups");
  const statusEl = document.getElementById("status");
  const apiUrlInput = document.getElementById("apiUrl");

  const { apiUrl } = await chrome.storage.local.get("apiUrl");
  if (apiUrl) {
    apiUrlInput.value = apiUrl;
  } else {
    apiUrlInput.value = "http://localhost:3001";
  }

  apiUrlInput.addEventListener("change", async () => {
    await chrome.storage.local.set({ apiUrl: apiUrlInput.value });
    statusEl.textContent = "API URL saved";
    statusEl.classList.add("active");
    setTimeout(() => {
      statusEl.textContent = "Ready to prototype";
      statusEl.classList.remove("active");
    }, 2000);
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
