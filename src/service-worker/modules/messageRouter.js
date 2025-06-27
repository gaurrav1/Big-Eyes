/**
 * MessageRouter module for delegating incoming Chrome runtime messages
 * to the appropriate service handlers.
 *
 * This module centralizes message type routing, improving maintainability
 * and separation of concerns. Each message type is mapped to a handler
 * function, which should be imported from the relevant service module.
 *
 * @module MessageRouter
 */

// Example imports (update these paths as needed for your project structure)
import * as tabService from "./tabService.js";
import * as dataService from "./dataService.js";
import * as searchService from "./searchService.js";

/**
 * Routes incoming messages to the appropriate service handler.
 *
 * @param {object} msg - The message object received from runtime.onMessage.
 * @param {object} sender - The sender object from runtime.onMessage.
 * @param {function} sendResponse - The sendResponse callback from runtime.onMessage.
 * @param {object} context - An object containing shared state and service dependencies.
 *        Example: {
 *          registeredTabs,
 *          appData,
 *          saveState,
 *          activateNextAvailableTab,
 *          activeSearchTabId,
 *          isSearchActive,
 *          setActiveSearchTabId,
 *          setIsSearchActive,
 *          broadcastStatus,
 *          broadcastAppData,
 *          ...
 *        }
 */
export function handleMessage(msg, sender, sendResponse, context) {
  switch (msg.type) {
    // Tab registration and lifecycle
    case "REGISTER_TAB":
      tabService.registerTab(
        sender.tab,
        context.registeredTabs,
        context.appData,
        context.saveState,
        sendResponse,
        context.activeSearchTabId,
      );
      break;
    case "UNREGISTER_TAB":
      if (sender.tab?.id) {
        tabService.unregisterTab(
          sender.tab.id,
          context.registeredTabs,
          context.activeSearchTabId,
          context.activateNextAvailableTab,
        );
      }
      sendResponse({ success: true });
      break;
    case "TAB_REDIRECTED":
      if (sender.tab?.id) {
        tabService.handleTabRedirect(
          sender.tab.id,
          context.registeredTabs,
          context.activeSearchTabId,
          context.isSearchActive,
          context.activateNextAvailableTab,
          context.appData,
        );
        // Open a new tab to continue searching
        tabService.openNewSearchTab(context.appData);
      }
      sendResponse({ success: true });
      break;

    // App data state management
    case "INIT_APP_DATA":
      dataService.handleAppDataInit(msg, context, sendResponse);
      break;

    case "GET_APP_DATA":
      sendResponse({ appData: context.appData });
      break;

    case "UPDATE_APP_DATA":
      dataService.handleAppDataUpdate(msg, context, sendResponse);
      break;

    // Search/fetch state management
    case "TOGGLE_SEARCH":
      searchService.handleSearchToggle(msg, sender, sendResponse, context);
      break;
    case "GET_SEARCH_STATUS":
      sendResponse({ isActive: context.isSearchActive });
      break;

    // Add additional message types and handlers as needed

    default:
      // Unknown message type
      sendResponse({ error: "Unknown message type" });
      break;
  }
  // Return true to keep the messaging channel open for async responses
  return true;
}

/**
 * Example: You may want to provide a function to register the router with Chrome.
 * Usage in main.js:
 *   chrome.runtime.onMessage.addListener((msg, sender, sendResponse) =>
 *     handleMessage(msg, sender, sendResponse, context)
 *   );
 */
