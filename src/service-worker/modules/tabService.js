/**
 * TabService module for managing content tab registration, activation, removal, and redirection.
 * Handles tab lifecycle and ensures only valid tabs are tracked for extension operations.
 *
 * All tab-related state is managed externally and passed in as arguments for testability and decoupling.
 *
 * @module TabService
 */

/**
 * Registers a content tab if it matches the expected URL pattern.
 * Updates the registeredTabs map and persists state.
 *
 * @param {object} senderTab - The sender.tab object from a Chrome message event.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {object} appData - Current application data to send to the tab.
 * @param {function} saveState - Callback to persist state.
 * @param {function} sendResponse - Chrome sendResponse callback.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 */
export function registerTab(
  senderTab,
  registeredTabs,
  appData,
  saveState,
  sendResponse,
  activeSearchTabId,
) {
  if (!senderTab?.id || !senderTab.url.includes("hiring.amazon.com")) {
    console.log("TabService: Registration failed for URL:", senderTab?.url);
    sendResponse({ registered: false });
    return;
  }

  const tabId = senderTab.id;
  registeredTabs.set(tabId, { lastActive: Date.now() });

  console.log("TabService: Registered tab", tabId, senderTab.url);

  sendResponse({
    isActive: tabId === activeSearchTabId,
    registered: true,
  });

  saveState();

  // Send current app data to the new tab
  chrome.tabs.sendMessage(tabId, {
    type: "APP_DATA_UPDATE",
    payload: appData,
    timestamp: Date.now(),
  });
}

/**
 * Unregisters a tab from the registeredTabs map.
 * If the tab was the active search tab, triggers activation of the next available tab.
 *
 * @param {number} tabId - The ID of the tab to unregister.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 * @param {function} activateNextAvailableTab - Callback to activate the next available tab.
 */
export function unregisterTab(
  tabId,
  registeredTabs,
  activeSearchTabId,
  activateNextAvailableTab,
) {
  registeredTabs.delete(tabId);

  if (activeSearchTabId === tabId) {
    activateNextAvailableTab();
  }
}

/**
 * Handles tab removal event.
 * Cleans up the registeredTabs map and triggers activation if needed.
 *
 * @param {number} tabId - The ID of the removed tab.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 * @param {function} activateNextAvailableTab - Callback to activate the next available tab.
 */
export function handleTabRemoved(
  tabId,
  registeredTabs,
  activeSearchTabId,
  activateNextAvailableTab,
) {
  registeredTabs.delete(tabId);
  if (activeSearchTabId === tabId) {
    activateNextAvailableTab();
  }
}

/**
 * Handles tab updates (e.g., navigation, reload).
 * If the tab is registered and navigates away from the expected domain, triggers redirect handling.
 * Otherwise, updates the tab with the latest app data and fetch status.
 *
 * @param {object} tab - The updated tab object.
 * @param {object} changeInfo - Chrome changeInfo object.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {object} appData - Current application data.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 * @param {boolean} isSearchActive - Whether search is currently active.
 * @param {function} handleTabRedirect - Callback to handle tab redirection.
 */
export function handleTabUpdated(
  tab,
  changeInfo,
  registeredTabs,
  appData,
  activeSearchTabId,
  isSearchActive,
  handleTabRedirect,
) {
  if (changeInfo.status === "complete" && registeredTabs.has(tab.id)) {
    if (!tab.url.includes("hiring.amazon.com")) {
      handleTabRedirect(tab.id);
      return;
    }

    chrome.tabs.sendMessage(tab.id, {
      type: "APP_DATA_UPDATE",
      payload: appData,
      timestamp: Date.now(),
    });

    if (activeSearchTabId === tab.id && isSearchActive) {
      chrome.tabs.sendMessage(tab.id, {
        type: "FETCH_STATUS_UPDATE",
        isActive: true,
      });
    }
  }
}

/**
 * Checks if a tab is a valid, recently active content tab.
 *
 * @param {number} tabId - The tab ID to check.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number} [activeWindowMs=300000] - Time window in ms for recent activity (default: 5 minutes).
 * @returns {boolean} True if the tab is valid and recently active.
 */
export function isValidContentTab(
  tabId,
  registeredTabs,
  activeWindowMs = 300000,
) {
  return (
    registeredTabs.has(tabId) &&
    registeredTabs.get(tabId).lastActive > Date.now() - activeWindowMs
  );
}

/**
 * Handles tab redirection (when a registered tab navigates away from the expected domain).
 * Removes the tab from registeredTabs and, if it was the active search tab, activates the next available tab.
 * Broadcasts search status sync to the popup.
 *
 * @param {number} tabId - The redirected tab ID.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 * @param {boolean} isSearchActive - Whether search is currently active.
 * @param {function} activateNextAvailableTab - Callback to activate the next available tab.
 */
export function handleTabRedirect(
  tabId,
  registeredTabs,
  activeSearchTabId,
  isSearchActive,
  activateNextAvailableTab,
) {
  if (activeSearchTabId === tabId) {
    chrome.tabs
      .sendMessage(tabId, {
        type: "FETCH_STATUS_UPDATE",
        isActive: false,
      })
      .catch(() => {});

    registeredTabs.delete(tabId);
    activateNextAvailableTab();
  } else if (registeredTabs.has(tabId)) {
    registeredTabs.delete(tabId);
  }

  // Sync with popup
  chrome.runtime
    .sendMessage({
      type: "SEARCH_STATUS_SYNC",
      isActive: isSearchActive,
    })
    .catch(() => {});
}

/**
 * Finds and activates the most recently active eligible tab.
 * Updates the activeSearchTabId and sends fetch status to the new tab.
 * If no eligible tab is found, disables search.
 *
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID (will be updated).
 * @param {boolean} isSearchActive - Whether search is currently active (will be updated).
 * @param {function} setActiveSearchTabId - Setter for activeSearchTabId.
 * @param {function} setIsSearchActive - Setter for isSearchActive.
 * @param {function} broadcastStatus - Callback to broadcast fetch status to all tabs.
 */
export function activateNextAvailableTab(
  registeredTabs,
  activeSearchTabId,
  isSearchActive,
  setActiveSearchTabId,
  setIsSearchActive,
  broadcastStatus,
) {
  if (!isSearchActive) return;

  let nextTabId = null;
  let lastActive = 0;

  for (const [tabId, data] of registeredTabs) {
    if (data.lastActive > lastActive && tabId !== activeSearchTabId) {
      nextTabId = tabId;
      lastActive = data.lastActive;
    }
  }

  if (nextTabId) {
    setActiveSearchTabId(nextTabId);
    chrome.tabs
      .sendMessage(nextTabId, {
        type: "FETCH_STATUS_UPDATE",
        isActive: true,
      })
      .catch(() => {
        registeredTabs.delete(nextTabId);
        activateNextAvailableTab(
          registeredTabs,
          activeSearchTabId,
          isSearchActive,
          setActiveSearchTabId,
          setIsSearchActive,
          broadcastStatus,
        );
      });
  } else {
    setIsSearchActive(false);
    setActiveSearchTabId(null);
    chrome.storage.local.set({ isSearchActive: false });
  }

  broadcastStatus();

  // Sync with popup
  chrome.runtime
    .sendMessage({
      type: "SEARCH_STATUS_SYNC",
      isActive: isSearchActive,
    })
    .catch(() => {});
}
