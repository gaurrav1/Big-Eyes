/**
 * SearchService module for managing search/fetch state and toggling logic.
 * Handles activation/deactivation of search, tracks the active search tab,
 * and broadcasts status updates to content scripts and popup.
 *
 * All state is managed externally and passed in as arguments for testability and decoupling.
 *
 * @module SearchService
 */

/**
 * Handles toggling of the search/fetch state.
 * Activates the most recently used valid content tab when enabling search,
 * or deactivates search and notifies the active tab when disabling.
 *
 * @param {object} msg - The message object (should contain isActive).
 * @param {object} sender - The sender object from Chrome messaging.
 * @param {function} sendResponse - The Chrome sendResponse callback.
 * @param {object} context - Shared state and dependencies:
 *   {
 *     registeredTabs: Map<number, object>,
 *     setActiveSearchTabId: function,
 *     setIsSearchActive: function,
 *     activeSearchTabId: number|null,
 *     isSearchActive: boolean,
 *     broadcastStatus: function,
 *   }
 */
export function handleSearchToggle(msg, sender, sendResponse, context) {
  const {
    registeredTabs,
    setActiveSearchTabId,
    setIsSearchActive,
    activeSearchTabId,
    isSearchActive,
    broadcastStatus,
  } = context;

  if (msg.isActive) {
    // Find the most recently used valid content tab
    let bestTabId = null;
    let bestLastActive = 0;

    for (const [tabId, data] of registeredTabs) {
      if (data.lastActive > bestLastActive) {
        bestTabId = tabId;
        bestLastActive = data.lastActive;
      }
    }

    if (bestTabId) {
      setActiveSearchTabId(bestTabId);
      setIsSearchActive(true);

      // Update tab priority
      registeredTabs.set(bestTabId, { lastActive: Date.now() });

      broadcastStatus();
      sendResponse({ success: true });
    } else {
      sendResponse({ success: false, error: "No valid content tabs found" });
    }
  } else {
    setIsSearchActive(false);

    if (activeSearchTabId) {
      // Notify the previously active tab that search is now inactive
      try {
        chrome.tabs.sendMessage(activeSearchTabId, {
          type: "FETCH_STATUS_UPDATE",
          isActive: false,
        });
      } catch (e) {
        // Ignore errors if tab is closed/unreachable
      }
    }

    setActiveSearchTabId(null);
    broadcastStatus();
    sendResponse({ success: true });
  }
}

/**
 * Broadcasts the current fetch/search status to all registered tabs.
 * Each tab receives a message indicating whether it is the active search tab.
 *
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number|null} activeSearchTabId - The currently active search tab ID.
 */
export function broadcastStatus(registeredTabs, activeSearchTabId) {
  for (const [tabId] of registeredTabs) {
    chrome.tabs
      .sendMessage(tabId, {
        type: "FETCH_STATUS_UPDATE",
        isActive: tabId === activeSearchTabId,
      })
      .catch(() => {
        registeredTabs.delete(tabId);
      });
  }
}

/**
 * Returns the current search/fetch active status.
 *
 * @param {boolean} isSearchActive - Whether search is currently active.
 * @returns {object} Object with isActive property.
 */
export function getSearchStatus(isSearchActive) {
  return { isActive: isSearchActive };
}
