// --- Imports ---
import * as tabService from "./modules/tabService.js";
import * as dataService from "./modules/dataService.js";
import * as searchService from "./modules/searchService.js";
import { handleMessage } from "./modules/messageRouter.js";
import * as utils from "./modules/utils.js";

// --- State ---
let appData = {
  centerOfCityCoordinates: null,
  commuteDistance: 35,
  otherCities: [],
  shiftPriorities: ["FLEX_TIME", "FULL_TIME", "PART_TIME", "REDUCED_TIME"],
  shiftPrioritized: false, // NEW FIELD
  cityPrioritized: false, // NEW FIELD
  timestamp: 0,
};
let isSearchActive = false;
let activeSearchTabId = null;
let registeredTabs = new Map();

// --- State Setters ---
function setAppData(newData) {
  appData = newData;
}
function setIsSearchActive(val) {
  isSearchActive = val;
}
function setActiveSearchTabId(val) {
  activeSearchTabId = val;
}
function setRegisteredTabs(map) {
  registeredTabs = map;
}

// --- Persistence ---
function saveState() {
  dataService.saveState(registeredTabs, activeSearchTabId, isSearchActive);
}

// --- Broadcast ---
function broadcastAppData() {
  dataService.broadcastAppData(registeredTabs, appData);
}
function broadcastStatus() {
  searchService.broadcastStatus(registeredTabs, activeSearchTabId);
}

// --- Tab Activation ---
function activateNextAvailableTab() {
  tabService.activateNextAvailableTab(
    registeredTabs,
    activeSearchTabId,
    isSearchActive,
    setActiveSearchTabId,
    setIsSearchActive,
    broadcastStatus,
  );
}

// --- Load persisted state on startup ---
dataService.loadState({
  setAppData,
  setIsSearchActive,
  setRegisteredTabs,
  setActiveSearchTabId,
  saveState,
});

// Add this after loading state:
broadcastAppData();

// --- Tab lifecycle events ---
chrome.tabs.onRemoved.addListener((tabId) => {
  tabService.handleTabRemoved(
    tabId,
    registeredTabs,
    activeSearchTabId,
    activateNextAvailableTab,
  );
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  tabService.handleTabUpdated(
    { id: tabId, url: tab?.url ?? "" },
    changeInfo,
    registeredTabs,
    appData,
    activeSearchTabId,
    isSearchActive,
    (id) =>
      tabService.handleTabRedirect(
        id,
        registeredTabs,
        activeSearchTabId,
        isSearchActive,
        activateNextAvailableTab,
      ),
  );
});

// --- Message Routing ---
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  return handleMessage(msg, sender, sendResponse, {
    appData,
    setAppData,
    saveState,
    broadcastAppData,
    registeredTabs,
    setRegisteredTabs,
    activeSearchTabId,
    setActiveSearchTabId,
    isSearchActive,
    setIsSearchActive,
    activateNextAvailableTab,
    broadcastStatus,
  });
});

console.log("Service worker loaded and modularized.");

// ----- Network Error Handling -----
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "NETWORK_ERROR") {
    console.error("Network error occurred");
    chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
  }
});

// ----- Network Error Handling -----

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === "PLAY_ALERT_SOUND") {
    for (const tabId of registeredTabs.keys()) {
      chrome.tabs.sendMessage(tabId, { type: "PLAY_ALERT_SOUND" });
    }
    sendResponse({ success: true });
    return true;
  }
  // ...other handlers...
});
