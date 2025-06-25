/**
 * Storage module for Chrome extension local storage utilities.
 * Provides promise-based wrappers for get/set operations and common helpers.
 *
 * @module Storage
 */

/**
 * Gets values from chrome.storage.local as a Promise.
 *
 * @param {string|string[]|object|null|undefined} keys - A single key, list of keys, or object specifying default values.
 * @returns {Promise<object>} Resolves to an object with the requested keys and their values.
 */
export function getFromStorage(keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.get(keys, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result);
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Sets values in chrome.storage.local as a Promise.
 *
 * @param {object} items - An object which gives each key/value pair to update storage with.
 * @returns {Promise<void>} Resolves when the values are set.
 */
export function setInStorage(items) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.set(items, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Removes one or more items from chrome.storage.local as a Promise.
 *
 * @param {string|string[]} keys - A single key or list of keys to remove.
 * @returns {Promise<void>} Resolves when the keys are removed.
 */
export function removeFromStorage(keys) {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.remove(keys, () => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}

/**
 * Clears all data from chrome.storage.local as a Promise.
 *
 * @returns {Promise<void>} Resolves when storage is cleared.
 */
export function clearStorage() {
  return new Promise((resolve, reject) => {
    try {
      chrome.storage.local.clear(() => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    } catch (e) {
      reject(e);
    }
  });
}
