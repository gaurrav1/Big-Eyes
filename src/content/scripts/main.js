import { JobFetcher } from "./jobFetcher.js";

let currentTabId;
async function init() {
  currentTabId = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (res) => resolve(res?.tabId));
  });
  console.log("Current Tab ID:", currentTabId);
}

init();


// Listen for state updates
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === "APP_DATA_UPDATE") {
    JobFetcher.updateAppData(msg.payload);
  }

  if (msg.type === "GET_TAB_STATE") {
    if (msg.isActive && currentTabId === msg.activeTabId) {
      JobFetcher.start();
    } else {
      JobFetcher.stop();
    }
  }
});

// Tab navigation detection
let currentUrl = location.href;
const observer = new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    if (!currentUrl.includes("jobSearch")) {
      chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
    }
  }
});
observer.observe(document, { subtree: true, childList: true });


chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "TOGGLE_CLICKED") {
    // Handle toggle
    console.log("Toggle clicked from popup on this tab:", location.href);
  }
});
