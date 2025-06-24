let isFetching = false;
let appData = {};
let latestTimestamp = 0;
let currentTabId = null;
// Tab registration with error handling
function registerTab() {
    chrome.runtime.sendMessage({ type: "REGISTER_TAB" }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("Registration error, retrying...", chrome.runtime.lastError);
            setTimeout(registerTab, 2000); // Retry after 2 seconds
            return;
        }

        console.log("Registration response:", response);
        if (response?.isActive) {
            startFetching();
        }
    });
}

// Initial registration with delay
setTimeout(registerTab, 1000);
console.log("Current tab id", currentTabId);

// Performance-optimized fetch loop
const fetchLoop = () => {
    if (!isFetching) return;

    const startTime = performance.now();

    // Actual fetching logic
    console.log("Fetching with:", appData);

    // Use microtask scheduling for optimal performance
    const nextFrame = () => {
        const elapsed = performance.now() - startTime;
        const delay = Math.max(0, 1000 - elapsed); // Target 1s intervals

        if (isFetching) {
            setTimeout(fetchLoop, delay);
        }
    };

    requestAnimationFrame(nextFrame);
};

// Tab registration
chrome.runtime.connect().onDisconnect.addListener(() => {
    chrome.runtime.sendMessage({ type: "UNREGISTER_TAB" });
});

chrome.runtime.sendMessage({ type: "REGISTER_TAB" }, (response) => {
    if (response?.isActive) {
        startFetching();
    }
});

// Message handling
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "APP_DATA_UPDATE" && msg.timestamp > latestTimestamp) {
        latestTimestamp = msg.timestamp;
        appData = msg.payload;
    }

    if (msg.type === "FETCH_STATUS_UPDATE") {
        if (msg.isActive) startFetching();
        else stopFetching();
    }
});

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

// Tab navigation detection
let currentUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        if (!currentUrl.includes('hiring.amazon.ca/search')) {
            chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
        }
    }
});

observer.observe(document, { subtree: true, childList: true });