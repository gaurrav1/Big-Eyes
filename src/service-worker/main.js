import { DEFAULT_APP_DATA } from "./modules/defaultData.js";

const STORAGE_KEY_APP_DATA = "appData";
const STORAGE_KEY_TAB_STATE = "tabState";

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    [STORAGE_KEY_APP_DATA]: DEFAULT_APP_DATA,
    [STORAGE_KEY_TAB_STATE]: {
      isActive: false,
      activeTabId: null,
    },
  });
});

// State management
let appData = DEFAULT_APP_DATA;
let tabState = { isActive: false, activeTabId: null };

// Load state from storage
chrome.storage.local.get(
  [STORAGE_KEY_TAB_STATE, STORAGE_KEY_APP_DATA],
  (result) => {
    tabState = result[STORAGE_KEY_TAB_STATE] || tabState;
    appData = result[STORAGE_KEY_APP_DATA] || appData;
  },
);

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case "PLAY_ALERT_SOUND":

          break;

    case "GET_APP_DATA":
      sendResponse(appData);
      break;

    case "GET_TAB_ID":
        sendResponse({ tabId: sender.tab?.id });
        break;

    case "UPDATE_APP_DATA":
      appData = { ...appData, ...message.payload };
      chrome.storage.local.set({ [STORAGE_KEY_APP_DATA]: appData });

      // Broadcast to all content scripts
      chrome.tabs.query({ url: "*://*.hiring.amazon.com/*" }, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.sendMessage(tab.id, {
            type: "APP_DATA_UPDATE",
            payload: appData,
          });
        });
      });
      break;

    case "TOGGLE_FETCHING":
      handleFetchToggle(message.isActive)
        .then(() => sendResponse({ success: true }))
        .catch((err) =>
          sendResponse({
            success: false,
            error: err?.message || "Unknown error",
          }),
        );
      break;

    case "TAB_REDIRECTED":
      if (sender.tab.id === tabState.activeTabId) {
        updateTabState({ isActive: false, activeTabId: null });
      }
      break;

    case "GET_TAB_STATE":
      sendResponse(tabState);
      break;

    case "FETCH_STATUS_UPDATE":
        sendResponse(tabState.isActive)
        break;

    case "OPEN_JOB_SEARCH_TAB":
        chrome.tabs.create({
            url: "https://hiring.amazon.com/app#/jobSearch",
            // active: true,
        }, (tab) => {
            updateTabState({ isActive: true, activeTabId: tab.id });

            // Optionally send APP_DATA_UPDATE to new tab
            chrome.tabs.sendMessage(tab.id, {
                type: "APP_DATA_UPDATE",
                payload: appData,
            });
        });
        break;

    case "CLEAR_ACTIVE_TAB":
        updateTabState({ isActive: false, activeTabId: null });
        break;


  }
  return true;
});

// Tab lifecycle management
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === tabState.activeTabId) {
    updateTabState({ isActive: false, activeTabId: null });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (tabId === tabState.activeTabId && changeInfo.url) {
    if (!changeInfo.url.includes("jobSearch")) {
      updateTabState({ isActive: false, activeTabId: null });
    }
  }
});

// Helper functions
async function handleFetchToggle(isActive) {
  if (isActive) {
    // Validate existing tab
    if (tabState.activeTabId) {
      try {
        const tab = await chrome.tabs.get(tabState.activeTabId);
          if (tab.url.includes("jobSearch")) {
              chrome.tabs.sendMessage(tab.id, {
                  type: "APP_DATA_UPDATE",
                  payload: appData,
              });
              updateTabState({ isActive: true, activeTabId: tab.id });
              return;
          }

      } catch (e) {
        console.error("")
      }
    }

    // Find or create job search tab
    const tabs = await chrome.tabs.query({
      url: "*://*.hiring.amazon.com/app#/jobSearch*",
    });
    const validTab = tabs.find((tab) => tab.id);

    if (validTab) {
      updateTabState({ isActive: true, activeTabId: validTab.id });
    } else {
      const newTab = await chrome.tabs.create({
        url: "https://hiring.amazon.com/app#/jobSearch",
        active: true,
      });
      updateTabState({ isActive: true, activeTabId: newTab.id });
    }
  } else {
    updateTabState({ isActive: false, activeTabId: null });
  }
}

function updateTabState(newState) {
  tabState = { ...tabState, ...newState };
  chrome.storage.local.set({ [STORAGE_KEY_TAB_STATE]: tabState });

  // Notify active tab about status change
  if (tabState.activeTabId) {
    chrome.tabs
      .sendMessage(tabState.activeTabId, {
        type: "FETCH_STATUS_UPDATE",
        isActive: tabState.isActive,
      })
      .catch(() => {});
  }

  // Broadcast to entire extension
  chrome.runtime
    .sendMessage({
      type: "TAB_STATE_UPDATE",
      tabState: tabState,
    })
    .catch(() => {});
}
