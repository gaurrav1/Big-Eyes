import { JobFetcher } from './jobFetcher.js';

// Tab registration with error handling
function registerTab() {
    chrome.runtime.sendMessage({ type: "REGISTER_TAB" }, (response) => {
        if (chrome.runtime.lastError) {
            console.warn("Registration error, retrying...", chrome.runtime.lastError);
            setTimeout(registerTab, 2000);
            return;
        }
        console.log("Registration response:", response);
    });
}

// Initial registration
setTimeout(registerTab, 1000);

// Tab lifecycle
chrome.runtime.connect().onDisconnect.addListener(() => {
    chrome.runtime.sendMessage({ type: "UNREGISTER_TAB" });
});

// Message handling
chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "APP_DATA_UPDATE") {
        JobFetcher.updateAppData(msg.payload);
    }

    if (msg.type === "FETCH_STATUS_UPDATE") {
        msg.isActive ? JobFetcher.start() : JobFetcher.stop();
    }
});

// Tab navigation detection
let currentUrl = location.href;
const observer = new MutationObserver(() => {
    if (location.href !== currentUrl) {
        currentUrl = location.href;
        if (!currentUrl.includes('https://hiring.amazon.com/app#/jobSearch')) {
            chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
        }
    }
});

observer.observe(document, { subtree: true, childList: true });