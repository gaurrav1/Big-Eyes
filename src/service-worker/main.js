let appData = {
    centerOfCityCoordinates: null,
    commuteDistance: 35,
    otherCities: [],
    shiftPriorities: ["Flex", "Full", "Part", "Reduced"],
    timestamp: 0
};

let activeFetchingTabId = null;
let registeredTabs = new Set();

// Tab management
chrome.tabs.onRemoved.addListener((tabId) => {
    registeredTabs.delete(tabId);
    if (activeFetchingTabId === tabId) {
        activeFetchingTabId = null;
        broadcastStatus();
    }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
        case "INIT_APP_DATA":
            if (msg.payload.timestamp > appData.timestamp) {
                appData = msg.payload;
            }
            sendResponse(appData);
            break;

        case "UPDATE_APP_DATA":
            if (msg.payload.timestamp > appData.timestamp) {
                appData = msg.payload;
                broadcastAppData();
            }
            sendResponse({ success: true });
            break;

        case "REGISTER_TAB":
            if (sender.tab?.id) {
                registeredTabs.add(sender.tab.id);

                // Send current status to this tab
                sendResponse({
                    isActive: sender.tab.id === activeFetchingTabId
                });

                chrome.tabs.sendMessage(sender.tab.id, {
                    type: "APP_DATA_UPDATE",
                    payload: appData,
                    timestamp: Date.now()
                });
            }
            break;

        case "TOGGLE_FETCHING":
            if (msg.isActive) {
                // Start fetching - activate first registered tab
                if (registeredTabs.size > 0) {
                    activeFetchingTabId = Array.from(registeredTabs)[0];
                }
            } else {
                // Stop fetching
                activeFetchingTabId = null;
            }
            broadcastStatus();
            sendResponse({ success: true });
            break;

        case "GET_FETCH_STATUS":
            sendResponse({ isActive: activeFetchingTabId !== null });
            break;
    }
});

// Broadcast functions
function broadcastAppData() {
    registeredTabs.forEach(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "APP_DATA_UPDATE",
            payload: appData,
            timestamp: Date.now()
        }).catch(console.error);
    });
}

function broadcastStatus() {
    registeredTabs.forEach(tabId => {
        chrome.tabs.sendMessage(tabId, {
            type: "FETCH_STATUS_UPDATE",
            isActive: activeFetchingTabId === tabId
        }).catch(console.error);
    });
}