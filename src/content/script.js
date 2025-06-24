let isFetching = false;
let appData = {};
let latestTimestamp = 0;

chrome.runtime.sendMessage({ type: "REGISTER_TAB" }, (response) => {
    if (response?.isActive) {
        startFetching();
    }
});

// Handle app data updates
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "APP_DATA_UPDATE" && msg.timestamp > latestTimestamp) {
        latestTimestamp = msg.timestamp;
        appData = msg.payload;
        console.log("Updated appData:", appData);
    }

    if (msg.type === "FETCH_STATUS_UPDATE") {
        if (msg.isActive) startFetching();
        else stopFetching();
    }
});

// Update startFetching
function startFetching() {
    if (isFetching) return;
    isFetching = true;
    console.log("🔁 Fetching started");
    fetchLoop();
}

function stopFetching() {
    isFetching = false;
    console.log("🛑 Fetching stopped");
}

// Update fetchLoop to handle background page suspension
function fetchLoop() {
    if (!isFetching) return;

    // Actual fetching logic
    console.log("Fetching with:", appData);

    // Use requestAnimationFrame for better resource management
    requestAnimationFrame(fetchLoop);
}

// Initialize
chrome.runtime.sendMessage({ type: "REGISTER_TAB" });