/**
 * Utils module for shared helper functions used across service worker modules.
 * Place all generic, reusable logic here.
 *
 * @module Utils
 */

/**
 * Checks if a tab is a valid, recently active content tab.
 * Used to determine if a tab should be considered for search/activation.
 *
 * @param {number} tabId - The tab ID to check.
 * @param {Map<number, object>} registeredTabs - Map of tabId to tab metadata.
 * @param {number} [activeWindowMs=300000] - Time window in ms for recent activity (default: 5 minutes).
 * @returns {boolean} True if the tab is valid and recently active.
 */
export function isValidContentTab(tabId, registeredTabs, activeWindowMs = 300000) {
  return (
    registeredTabs.has(tabId) &&
    registeredTabs.get(tabId).lastActive > Date.now() - activeWindowMs
  );
}

/**
 * Converts a plain object to a Map<number, object>.
 * Useful for restoring Maps from storage.
 *
 * @param {object} obj - The object to convert.
 * @returns {Map<number, object>} The resulting Map.
 */
export function objectToNumberMap(obj) {
  return new Map(
    Object.entries(obj || {}).map(([k, v]) => [parseInt(k, 10), v])
  );
}

/**
 * Converts a Map<number, object> to a plain object.
 * Useful for persisting Maps to storage.
 *
 * @param {Map<number, object>} map - The Map to convert.
 * @returns {object} The resulting plain object.
 */
export function numberMapToObject(map) {
  const obj = {};
  for (const [k, v] of map.entries()) {
    obj[k] = v;
  }
  return obj;
}

/**
 * Safely sends a message to a tab, catching errors if the tab is closed or unreachable.
 *
 * @param {number} tabId - The ID of the tab to send the message to.
 * @param {object} message - The message object to send.
 * @returns {Promise<void>}
 */
export async function safeSendMessage(tabId, message) {
  try {
    await chrome.tabs.sendMessage(tabId, message);
  } catch (e) {
    // Tab may have been closed or unreachable; ignore error.
  }
}

/**
 * Safely sends a message to the extension runtime, catching errors if the recipient is unavailable.
 *
 * @param {object} message - The message object to send.
 * @returns {Promise<void>}
 */
export async function safeSendRuntimeMessage(message) {
  try {
    await chrome.runtime.sendMessage(message);
  } catch (e) {
    // Recipient may be unavailable; ignore error.
  }
}
