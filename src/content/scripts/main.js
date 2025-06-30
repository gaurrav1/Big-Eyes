import { JobFetcher } from "./jobFetcher.js";

let isActive = false;
let tabId;

async function init() {
  tabId = await new Promise((resolve) => {
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
      JobFetcher.start();
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

      sendResponse();
      break;

    case "GET_TAB_STATE":
      sendResponse({ isActive, tabId });
      break;

    case "APP_DATA_UPDATE":
      JobFetcher.updateAppData(msg.payload);
      sendResponse();
      break;

    case "TAB_STATE_UPDATE":
      if (msg.activeTabId === tabId && msg.isActive) {
        if (!isActive) {
          JobFetcher.start();
        }
      } else {
        if (isActive) {
          JobFetcher.stop();
        }
      }
      break;

    default:
      sendResponse();
      break;
  }
});
