import { DEFAULT_APP_DATA } from "./modules/defaultData.js";
import { ALL_COUNTRY_DATA } from "./modules/countryData.js";

// Service Worker Auto-refresh system (chrome.storage.local compatible)
let serviceWorkerAutoRefresh = {
  intervalId: null,
  isRunning: false,
  lastCleanupTime: 0,
  cleanupCount: 0,
  errorCount: 0
};

// Service worker compatible auto-refresh manager
const ServiceWorkerAutoRefreshManager = {
  async start() {
    if (serviceWorkerAutoRefresh.isRunning) {
      console.warn('[ServiceWorker] Auto-refresh already running');
      return false;
    }

    try {
      console.log('[ServiceWorker] Starting auto-refresh system');

      // Start periodic cleanup using chrome.alarms for better service worker compatibility
      serviceWorkerAutoRefresh.intervalId = setInterval(async () => {
        await this.performCleanup();
      }, 30 * 1000); // 30 seconds

      serviceWorkerAutoRefresh.isRunning = true;
      serviceWorkerAutoRefresh.lastCleanupTime = Date.now();
      console.log('[ServiceWorker] Auto-refresh system started successfully');
      return true;

    } catch (error) {
      console.error('[ServiceWorker] Failed to start auto-refresh system:', error);
      serviceWorkerAutoRefresh.errorCount++;
      return false;
    }
  },

  async stop() {
    if (!serviceWorkerAutoRefresh.isRunning) {
      console.warn('[ServiceWorker] Auto-refresh not running');
      return false;
    }

    try {
      if (serviceWorkerAutoRefresh.intervalId) {
        clearInterval(serviceWorkerAutoRefresh.intervalId);
        serviceWorkerAutoRefresh.intervalId = null;
      }

      serviceWorkerAutoRefresh.isRunning = false;
      console.log('[ServiceWorker] Auto-refresh system stopped');
      return true;

    } catch (error) {
      console.error('[ServiceWorker] Error stopping auto-refresh system:', error);
      serviceWorkerAutoRefresh.errorCount++;
      return false;
    }
  },

  async restart() {
    console.log('[ServiceWorker] Restarting auto-refresh system');
    await this.stop();
    return await this.start();
  },

  async performCleanup() {
    const startTime = Date.now();
    try {
      console.log('[ServiceWorker] Performing cleanup');

      // Get exhausted pairs from chrome.storage.local
      const result = await chrome.storage.local.get(['exhaustedJobSchedulePairs']);
      const stored = result.exhaustedJobSchedulePairs || {};

      const now = Date.now();
      let cleanedPairs = 0;
      const cleanedData = {};

      // Filter out expired entries
      for (const [key, exp] of Object.entries(stored)) {
        if (exp > now) {
          cleanedData[key] = exp;
        } else {
          cleanedPairs++;
        }
      }

      // Update storage if any expired were removed
      if (cleanedPairs > 0) {
        await chrome.storage.local.set({ exhaustedJobSchedulePairs: cleanedData });
        console.log(`[ServiceWorker] Cleaned ${cleanedPairs} expired pairs`);
      }

      serviceWorkerAutoRefresh.lastCleanupTime = Date.now();
      serviceWorkerAutoRefresh.cleanupCount++;

      const duration = Date.now() - startTime;
      console.log(`[ServiceWorker] Cleanup completed in ${duration}ms`);

      return {
        success: true,
        cleanedPairs,
        duration,
        totalPairsRemaining: Object.keys(cleanedData).length
      };

    } catch (error) {
      console.error('[ServiceWorker] Cleanup failed:', error);
      serviceWorkerAutoRefresh.errorCount++;
      return {
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  },

  getStatus() {
    return {
      isRunning: serviceWorkerAutoRefresh.isRunning,
      lastCleanupTime: serviceWorkerAutoRefresh.lastCleanupTime,
      cleanupCount: serviceWorkerAutoRefresh.cleanupCount,
      errorCount: serviceWorkerAutoRefresh.errorCount,
      environment: 'service-worker'
    };
  },

  async forceCleanup() {
    console.log('[ServiceWorker] Force cleanup requested');
    return await this.performCleanup();
  }
};

// Initialize auto-refresh manager with proper error handling
async function initializeAutoRefresh() {
  try {
    const started = await ServiceWorkerAutoRefreshManager.start();
    if (started) {
      console.log('[ServiceWorker] Auto-refresh system initialized successfully');
    } else {
      console.warn('[ServiceWorker] Failed to start auto-refresh system');
    }
  } catch (error) {
    console.error('[ServiceWorker] Failed to initialize auto-refresh system:', error);
  }
}

const STORAGE_KEY_APP_DATA = "appData";
const STORAGE_KEY_TAB_STATE = "tabState";
let urlToOpen = "";

// Initialize storage on installation
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    [STORAGE_KEY_APP_DATA]: DEFAULT_APP_DATA,
    [STORAGE_KEY_TAB_STATE]: {
      isActive: false,
      activeTabId: null,
    },
  });

  // Initialize auto-refresh system after storage setup
  await initializeAutoRefresh();
});

// State management
let appData = DEFAULT_APP_DATA;
let tabState = { isActive: false, activeTabId: null };

// Load state from storage
chrome.storage.local.get(
  [STORAGE_KEY_TAB_STATE, STORAGE_KEY_APP_DATA],
  async (result) => {
    tabState = result[STORAGE_KEY_TAB_STATE] || tabState;
    appData = result[STORAGE_KEY_APP_DATA] || appData;

    // Initialize auto-refresh system after state loading
    await initializeAutoRefresh();
  },
);


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
chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
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

          // Inside relevant places like updateTabState, UPDATE_APP_DATA, etc.
          ALL_COUNTRY_DATA.forEach((data) => {
            chrome.tabs.query({ url: data.wildCardUrl }, (tabs) => {
              tabs.forEach((tab) => {
                chrome.tabs.sendMessage(tab.id, {
                  type: "APP_DATA_UPDATE",
                  payload: appData,
                });
              });
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
      isAsync = true;
      break;

    case "FOCUS_WINDOW":
        // Focus the current window
        chrome.windows.getCurrent({}, (win) => {
          chrome.windows.update(win.id, { focused: true, state: "normal" });
        });
        sendResponse();
        break;

    case "JOB_FOUND_ACTIONS":
      updateTabState({ isActive: false, activeTabId: null });
      urlToOpen = message.openUrl;

      chrome.tabs.create(
        {
          url: urlToOpen,
          active: false,
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

    case "CLEAR_ACTIVE_TAB":
      updateTabState({ isActive: false, activeTabId: null });
      sendResponse();
      break;

    case "GET_COUNTRY":
      sendResponse({ country: country });
      break;

    case "AUTO_REFRESH_STATUS":
      sendResponse(ServiceWorkerAutoRefreshManager.getStatus());
      break;

    case "AUTO_REFRESH_START":
      try {
        const started = await ServiceWorkerAutoRefreshManager.start();
        sendResponse({ success: started });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      isAsync = true;
      break;

    case "AUTO_REFRESH_STOP":
      try {
        const stopped = await ServiceWorkerAutoRefreshManager.stop();
        sendResponse({ success: stopped });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      isAsync = true;
      break;

    case "AUTO_REFRESH_RESTART":
      try {
        const restarted = await ServiceWorkerAutoRefreshManager.restart();
        sendResponse({ success: restarted });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      isAsync = true;
      break;

    case "AUTO_REFRESH_FORCE_CLEANUP":
      try {
        const result = await ServiceWorkerAutoRefreshManager.forceCleanup();
        sendResponse(result);
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      isAsync = true;
      break;

    case "AUTO_REFRESH_UPDATE_CONFIG":
      // Service worker auto-refresh doesn't support config updates yet
      sendResponse({ 
        success: false, 
        error: "Config updates not supported in service worker environment" 
      });
      break;

    case "CLEAR_EXHAUSTED_DATA":
      try {
        // Clear exhausted data using chrome.storage.local directly
        const result = await chrome.storage.local.get(['exhaustedJobSchedulePairs', 'jobRotationQueue']);
        const beforePairs = Object.keys(result.exhaustedJobSchedulePairs || {}).length;
        const beforeQueue = (result.jobRotationQueue || []).length;

        await chrome.storage.local.remove(['exhaustedJobSchedulePairs', 'jobRotationQueue', 'rotationLastUpdate']);

        console.log('[ServiceWorker] Cleared all exhausted data', {
          clearedPairs: beforePairs,
          clearedQueueItems: beforeQueue
        });

        sendResponse({
          success: true,
          clearedPairs: beforePairs,
          clearedQueueItems: beforeQueue
        });
      } catch (error) {
        sendResponse({ 
          success: false, 
          error: error.message 
        });
      }
      isAsync = true;
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
  ALL_COUNTRY_DATA.forEach((data) => {
    chrome.tabs.query({url: data.wildCardUrl}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.sendMessage(tab.id, {
          type: "TAB_STATE_UPDATE",
          isActive: tabState.isActive,
          activeTabId: tabState.activeTabId,
        });
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
