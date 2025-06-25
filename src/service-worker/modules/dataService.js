/**
 * DataService module for managing application data state and persistence.
 * Handles initialization, updates, broadcasting, and storage of app data.
 *
 * All state is managed externally and passed in as arguments for testability and decoupling.
 *
 * @module DataService
 */

/**
 * Handles initialization of app data from a message.
 * Updates appData if the incoming payload is newer, and persists it.
 *
 * @param {object} msg - The message object (should contain payload and timestamp).
 * @param {object} context - Shared state and dependencies:
 *   {
 *     appData: object,
 *     setAppData: function,
 *     saveState: function,
 *   }
 * @param {function} sendResponse - The Chrome sendResponse callback.
 */
export function handleAppDataInit(msg, context, sendResponse) {
  const { appData, setAppData, saveState } = context;
  if (msg.payload.timestamp > appData.timestamp) {
    setAppData(msg.payload);
    if (saveState) saveState();
  }
  sendResponse(context.appData);
}

/**
 * Handles updating of app data from a message.
 * Updates appData if the incoming payload is newer, persists it, and broadcasts to all tabs.
 *
 * @param {object} msg - The message object (should contain payload and timestamp).
 * @param {object} context - Shared state and dependencies:
 *   {
 *     appData: object,
 *     setAppData: function,
 *     saveState: function,
 *     broadcastAppData: function,
 *   }
 * @param {function} sendResponse - The Chrome sendResponse callback.
 */
export function handleAppDataUpdate(msg, context, sendResponse) {
  const { appData, setAppData, saveState, broadcastAppData } = context;
  if (msg.payload.timestamp > appData.timestamp) {
    setAppData(msg.payload);
    if (saveState) saveState();
    if (broadcastAppData) broadcastAppData();
  }
  sendResponse({ success: true });
}

/**
 * Broadcasts the current app data to all registered tabs.
 *
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {object} appData - The current application data.
 */
export function broadcastAppData(registeredTabs, appData) {
  const dataMessage = {
    type: "APP_DATA_UPDATE",
    payload: appData,
    timestamp: Date.now(),
  };

  for (const tabId of registeredTabs.keys()) {
    chrome.tabs.sendMessage(tabId, dataMessage).catch(() => {
      registeredTabs.delete(tabId);
    });
  }
}

/**
 * Loads state from chrome.storage.local and restores registeredTabs and other stateful variables.
 * Cleans up tabs that no longer exist.
 *
 * @param {object} context - Shared state and dependencies:
 *   {
 *     setAppData: function,
 *     setIsSearchActive: function,
 *     setRegisteredTabs: function,
 *     setActiveSearchTabId: function,
 *     saveState: function,
 *   }
 */
export function loadState(context) {
  chrome.storage.local.get(
    ["appData", "isSearchActive", "registeredTabs", "activeSearchTabId"],
    (result) => {
      if (result.appData && context.setAppData) context.setAppData(result.appData);
      if (result.isSearchActive !== undefined && context.setIsSearchActive)
        context.setIsSearchActive(result.isSearchActive);

      // Restore registered tabs
      if (result.registeredTabs && context.setRegisteredTabs) {
        const registeredTabs = new Map(
          Object.entries(result.registeredTabs).map(([k, v]) => [parseInt(k), v])
        );

        // Clean up tabs that no longer exist
        for (const tabId of Array.from(registeredTabs.keys())) {
          chrome.tabs.get(tabId, (tab) => {
            if (chrome.runtime.lastError || !tab) {
              registeredTabs.delete(tabId);
              if (context.saveState) context.saveState();
            }
          });
        }
        context.setRegisteredTabs(registeredTabs);
      }

      if (result.activeSearchTabId && context.setActiveSearchTabId) {
        context.setActiveSearchTabId(result.activeSearchTabId);
      }
    }
  );
}

/**
 * Persists registeredTabs, activeSearchTabId, and isSearchActive to chrome.storage.local.
 *
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 * @param {boolean} isSearchActive - Whether search is currently active.
 */
export function saveState(registeredTabs, activeSearchTabId, isSearchActive) {
  chrome.storage.local.set({
    registeredTabs: Object.fromEntries(registeredTabs),
    activeSearchTabId,
    isSearchActive,
  });
}
