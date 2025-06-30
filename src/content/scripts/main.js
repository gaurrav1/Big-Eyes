import { JobFetcher } from "./jobFetcher.js";

let isActive = false;
let country = "United States";

async function init() {
  const tabId = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: "GET_TAB_ID" }, (res) =>
      resolve(res?.tabId),
    );
  });

  console.log("Current Tab ID:", tabId);

  chrome.runtime.sendMessage({ type: "GET_APP_DATA" }, (data) => {
    JobFetcher.updateAppData(data);
  });

  chrome.runtime.sendMessage({ type: "GET_TAB_STATE" }, (state) => {
    if (state?.isActive && state?.activeTabId === tabId) {
      console.log("[JobFetcher] Tab is active, starting fetcher");
      JobFetcher.start(country);

      // Notify popup UI toggle to update
      chrome.runtime.sendMessage({
        type: "TAB_STATE_UPDATE",
        isActive: true,
      });
    }
  });
}

init();

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case "TOGGLE_FETCHING":
      isActive = msg.isActive;
      if (isActive) {
        JobFetcher.start();
      } else {
        JobFetcher.stop();
      }
      chrome.runtime.sendMessage({ type: "TAB_STATE_UPDATE", isActive });
      sendResponse();
      break;

    case "GET_TAB_STATE":
      sendResponse({ isActive });
      break;

    case "APP_DATA_UPDATE":
      JobFetcher.updateAppData(msg.payload);
      sendResponse();
      break;

    default:
      sendResponse();
      break;
  }
});
