let appData = {
    centerOfCityCoordinates: null,
    commuteDistance: 35,
    otherCities: [],
    shiftPriorities: ["Flex", "Full", "Part", "Reduced"],
    timestamp: 0
};
console.log("Hi")
let isSearchActive = false;
let activeSearchTabId = null;
let registeredTabs = new Map(); // tabId: { lastActive: timestamp }

// Persist state across service worker restarts
chrome.storage.local.get(['appData', 'isSearchActive'], (result) => {
    if (result.appData) appData = result.appData;
    if (result.isSearchActive !== undefined) isSearchActive = result.isSearchActive;
});

// Tab lifecycle management
chrome.tabs.onRemoved.addListener((tabId) => {
    registeredTabs.delete(tabId);
    if (activeSearchTabId === tabId) {
        activateNextAvailableTab();
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === 'complete' && registeredTabs.has(tabId)) {
        if (!tab.url.includes('hiring.amazon.ca')) {
            handleTabRedirect(tabId);
            return;
        }

        chrome.tabs.sendMessage(tabId, {
            type: "APP_DATA_UPDATE",
            payload: appData,
            timestamp: Date.now()
        });

        if (activeSearchTabId === tabId && isSearchActive) {
            chrome.tabs.sendMessage(tabId, {
                type: "FETCH_STATUS_UPDATE",
                isActive: true
            });
        }
    }
});

// Helper function
function isValidContentTab(tabId) {
    return registeredTabs.has(tabId) &&
        registeredTabs.get(tabId).lastActive > Date.now() - 300000;
}

// Message handling
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
        case "INIT_APP_DATA":
            handleAppDataInit(msg, sendResponse);
            break;
        case "UPDATE_APP_DATA":
            handleAppDataUpdate(msg, sendResponse);
            break;
        case "REGISTER_TAB":
            handleTabRegistration(sender, sendResponse);
            break;
        case "UNREGISTER_TAB":
            handleTabUnregistration(sender);
            break;
        case "TOGGLE_SEARCH":
            handleSearchToggle(msg, sender, sendResponse);
            break;
        case "GET_SEARCH_STATUS":
            sendResponse({ isActive: isSearchActive });
            break;
        case "TAB_REDIRECTED":
            handleTabRedirect(sender.tab.id);
            break;
    }
    return true; // Keep messaging channel open
});

// Handler implementations
function handleAppDataInit(msg, sendResponse) {
    if (msg.payload.timestamp > appData.timestamp) {
        appData = msg.payload;
        chrome.storage.local.set({ appData });
    }
    sendResponse(appData);
}

function handleAppDataUpdate(msg, sendResponse) {
    if (msg.payload.timestamp > appData.timestamp) {
        appData = msg.payload;
        chrome.storage.local.set({ appData });
        broadcastAppData();
    }
    sendResponse({ success: true });
}

// Handler implementations
function handleTabRegistration(sender, sendResponse) {
    // Fix URL check to handle all subdomains and paths
    if (!sender.tab?.id || !sender.tab.url.includes('hiring.amazon.ca')) {
        console.log("Failed: " + sender.tab?.url);
        sendResponse({ registered: false });
        return;
    }

    console.log("Registered: " + sender.tab.url + "\n" + sender.tab.id);
    const tabId = sender.tab.id;
    registeredTabs.set(tabId, { lastActive: Date.now() });

    sendResponse({
        isActive: tabId === activeSearchTabId,
        registered: true
    });

    // Save state immediately
    saveState();

    // Send current app data to the new tab
    chrome.tabs.sendMessage(tabId, {
        type: "APP_DATA_UPDATE",
        payload: appData,
        timestamp: Date.now()
    });
}

// Add this function to persist state
function saveState() {
    chrome.storage.local.set({
        registeredTabs: Object.fromEntries(registeredTabs),
        activeSearchTabId,
        isSearchActive
    });
}

// Update initialization to load saved state
chrome.storage.local.get(['appData', 'isSearchActive', 'registeredTabs', 'activeSearchTabId'], (result) => {
    if (result.appData) appData = result.appData;
    if (result.isSearchActive !== undefined) isSearchActive = result.isSearchActive;

    // Restore registered tabs
    if (result.registeredTabs) {
        registeredTabs = new Map(Object.entries(result.registeredTabs).map(([k, v]) =>
            [parseInt(k), v]
        ));
    }

    if (result.activeSearchTabId) {
        activeSearchTabId = result.activeSearchTabId;
    }
});

function handleTabUnregistration(sender) {
    if (sender.tab?.id) {
        const tabId = sender.tab.id;
        registeredTabs.delete(tabId);

        if (activeSearchTabId === tabId) {
            activateNextAvailableTab();
        }
    }
}

function handleSearchToggle(msg, sender, sendResponse) {
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
            activeSearchTabId = bestTabId;
            isSearchActive = true;
            chrome.storage.local.set({ isSearchActive });

            // Update tab priority
            registeredTabs.set(bestTabId, { lastActive: Date.now() });

            broadcastStatus();
            sendResponse({ success: true });
        } else {
            sendResponse({ success: false, error: "No valid content tabs found" });
        }
    } else {
        isSearchActive = false;
        if (activeSearchTabId) {
            chrome.tabs.sendMessage(activeSearchTabId, {
                type: "FETCH_STATUS_UPDATE",
                isActive: false
            }).catch(() => {});
        }
        activeSearchTabId = null;
        chrome.storage.local.set({ isSearchActive });
        broadcastStatus();
        sendResponse({ success: true });
    }
}

function handleTabRedirect(tabId) {
    if (activeSearchTabId === tabId) {
        chrome.tabs.sendMessage(tabId, {
            type: "FETCH_STATUS_UPDATE",
            isActive: false
        }).catch(() => {});

        registeredTabs.delete(tabId);
        activateNextAvailableTab();
    } else if (registeredTabs.has(tabId)) {
        registeredTabs.delete(tabId);
    }

    // Sync with popup
    chrome.runtime.sendMessage({
        type: "SEARCH_STATUS_SYNC",
        isActive: isSearchActive
    }).catch(() => {});
}

// Tab activation logic
function activateNextAvailableTab() {
    if (!isSearchActive) return;

    // Find most recently active eligible tab
    let nextTabId = null;
    let lastActive = 0;

    for (const [tabId, data] of registeredTabs) {
        if (data.lastActive > lastActive && tabId !== activeSearchTabId) {
            nextTabId = tabId;
            lastActive = data.lastActive;
        }
    }

    if (nextTabId) {
        activeSearchTabId = nextTabId;
        chrome.tabs.sendMessage(nextTabId, {
            type: "FETCH_STATUS_UPDATE",
            isActive: true
        }).catch(() => {
            registeredTabs.delete(nextTabId);
            activateNextAvailableTab();
        });
    } else {
        isSearchActive = false;
        activeSearchTabId = null;
        chrome.storage.local.set({ isSearchActive });
    }

    broadcastStatus();

    // Sync with popup
    chrome.runtime.sendMessage({
        type: "SEARCH_STATUS_SYNC",
        isActive: isSearchActive
    }).catch(() => {});
}

// Broadcast utilities
function broadcastAppData() {
    const dataMessage = {
        type: "APP_DATA_UPDATE",
        payload: appData,
        timestamp: Date.now()
    };

    for (const tabId of registeredTabs.keys()) {
        chrome.tabs.sendMessage(tabId, dataMessage).catch(() => {
            registeredTabs.delete(tabId);
        });
    }
}

function broadcastStatus() {
    for (const [tabId] of registeredTabs) {
        chrome.tabs.sendMessage(tabId, {
            type: "FETCH_STATUS_UPDATE",
            isActive: tabId === activeSearchTabId
        }).catch(() => {
            registeredTabs.delete(tabId);
        });
    }
}