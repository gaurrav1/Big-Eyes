import { DEFAULT_APP_DATA } from "./modules/defaultData.js";
import { getCountryData } from "./modules/countryData.js";

const STORAGE_KEY_APP_DATA = "appData";
const STORAGE_KEY_TAB_STATE = "tabState";
const STORAGE_KEY_COUNTRY = "country";

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
let country = "CA";

// Load state from storage
chrome.storage.local.get(
  [STORAGE_KEY_TAB_STATE, STORAGE_KEY_APP_DATA, STORAGE_KEY_COUNTRY],
  (result) => {
    tabState = result[STORAGE_KEY_TAB_STATE] || tabState;
    appData = result[STORAGE_KEY_APP_DATA] || appData;
    country = result[STORAGE_KEY_COUNTRY] || country;
  },
);

let countryData = getCountryData(country);

async function ensureOffscreen() {
  const exists = await chrome.offscreen.hasDocument();
  if (!exists) {
    await chrome.offscreen.createDocument({
      url: "play-sound.html",
      reasons: ["AUDIO_PLAYBACK"],
      justification: "Play alert sound when job is found",
    });
  }
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.type === "PLAY_SOUND") {
    await ensureOffscreen();
    await chrome.runtime.sendMessage({ type: "PLAY_SOUND_OFFSCREEN" }); // forwarded to offscreen page
  }
});

// Message handling
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let isAsync = false;
  switch (message.type) {
    case "PLAY_ALERT_SOUND":
      sendResponse();
      break;

    case "GET_APP_DATA":
      sendResponse(appData);
      break;

    case "GET_TAB_ID":
      sendResponse({ tabId: sender.tab?.id });
      break;

    case "UPDATE_APP_DATA":
      appData = { ...appData, ...message.payload };

      chrome.storage.local
        .set({ [STORAGE_KEY_APP_DATA]: appData })
        .then((r) => {
          console.log(r);

          // Broadcast to all content scripts
          chrome.tabs.query({ url: countryData.wildCardUrl }, (tabs) => {
            tabs.forEach((tab) => {
              chrome.tabs
                .sendMessage(tab.id, {
                  type: "APP_DATA_UPDATE",
                  payload: appData,
                })
                .then((r) => console.log(r));
            });
          });
        });

      sendResponse();
      break;

    case "TOGGLE_FETCHING":
      handleFetchToggle(message.isActive, message.tabId)
        .then(() => sendResponse({ success: true }))
        .catch((err) =>
          sendResponse({
            success: false,
            error: err?.message || "Unknown error",
          }),
        );
      break;

    case "JOB_FOUND_ACTIONS":
      updateTabState({ isActive: false, activeTabId: null });
      // chrome.tabs.create(
      //   {
      //     url: countryData.jobSearchUrl,
      //     active: false,
      //   },
      //   (tab) => {
      //     updateTabState({ isActive: true, activeTabId: tab.id });
      //
      //     // Optionally send APP_DATA_UPDATE to new tab
      //     chrome.tabs.sendMessage(tab.id, {
      //       type: "APP_DATA_UPDATE",
      //       payload: appData,
      //     });
      //     sendResponse();
      //   },
      // );
      isAsync = true;
      break;

    case "TAB_REDIRECTED":
      if (sender.tab.id === tabState.activeTabId) {
        updateTabState({ isActive: false, activeTabId: null });
      }
      sendResponse();
      break;

    case "GET_TAB_STATE":
      sendResponse(tabState);
      break;

    case "FETCH_STATUS_UPDATE":
      sendResponse(tabState.isActive);
      break;

    case "OPEN_JOB_SEARCH_TAB":
      chrome.tabs.create(
        {
          url: countryData.jobSearchUrl,
          // active: true,
        },
        (tab) => {
          updateTabState({ isActive: true, activeTabId: tab.id });

          // Optionally send APP_DATA_UPDATE to new tab
          chrome.tabs.sendMessage(tab.id, {
            type: "APP_DATA_UPDATE",
            payload: appData,
          });
          sendResponse();
        },
      );
      isAsync = true;
      break;

    case "CLEAR_ACTIVE_TAB":
      updateTabState({ isActive: false, activeTabId: null });
      sendResponse();
      break;

    case "GET_COUNTRY":
      sendResponse({ country: country });
      break;

    case "COUNTRY_CHANGE_ACTION":
      if (message.country === country) {
        sendResponse({ success: true, message: "Country unchanged" });
        break;
      }

      // Turn off searching if active
      updateTabState({ isActive: false, activeTabId: null });

      // Update country reference
      const oldCountry = country;
      country = message.country;
      countryData = getCountryData(country);
      appData = DEFAULT_APP_DATA;

      // Update storage and notify components
      chrome.storage.local.set({ [STORAGE_KEY_COUNTRY]: country }).then(() => {
        // Single broadcast to all components
        chrome.runtime.sendMessage({
          type: "COUNTRY_CHANGE_UPDATE",
          message: { country }
        });

        // Update new country tabs only
        chrome.tabs.query({ url: countryData.wildCardUrl }, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              type: "APP_DATA_UPDATE",
              payload: appData
            });
          });
        });
      });

      // Update UI filters
      chrome.runtime.sendMessage({type: "APP_DATA_UPDATE", payload: appData})

      sendResponse({ success: true });
      break;

    default:
      sendResponse();
      break;
  }
  return isAsync;
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
async function handleFetchToggle(isActive, tabId) {
  if (isActive) {
    // Set the requesting tab as the new active tab
    updateTabState({ isActive: true, activeTabId: tabId });
  } else {
    updateTabState({ isActive: false, activeTabId: null });
  }
}

function updateTabState(newState) {
  tabState = { ...tabState, ...newState };
  chrome.storage.local.set({ [STORAGE_KEY_TAB_STATE]: tabState });

  // Notify all hiring.amazon.ca tabs
  chrome.tabs.query({ url: countryData.wildCardUrl }, (tabs) => {
    tabs.forEach((tab) => {
      chrome.tabs.sendMessage(tab.id, {
        type: "TAB_STATE_UPDATE",
        isActive: tabState.isActive,
        activeTabId: tabState.activeTabId,
      });
    });
  });

  // Notify popup/action UI
  chrome.runtime
    .sendMessage({
      type: "TAB_STATE_UPDATE",
      isActive: tabState.isActive,
      activeTabId: tabState.activeTabId,
    })
    .catch(() => {});
}
