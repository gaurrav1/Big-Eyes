import { JobProcessor } from "./jobProcessor.js";
import {getCountry, setCountry} from "./model/country";
import {markJobIdAsExhausted} from "./utils.js";

if (window.location.href.includes("hiring.amazon.com")) {
  console.log("Hiring amazon.com");
  setCountry({ name: "United States", tld: "com", extld: "us", locale: "en-US", jobSearchUrl: "https://hiring.amazon.com/app#/jobSearch" });
}
let country = getCountry();

const INTERVAL_MS = 500;
const FETCH_CONCURRENCY = 5;

let previouslySelected = new Set();

function loadSelectedFromStorage() {
  try {
    const raw = localStorage.getItem("selectedPairs");
    const parsed = raw ? JSON.parse(raw) : [];
    previouslySelected = new Set(parsed);
  } catch (e) {
    previouslySelected = new Set();
  }
}

function saveSelectedToStorage() {
  localStorage.setItem("selectedPairs", JSON.stringify([...previouslySelected]));
}

function resetSelectedListEveryMinute() {
  setInterval(() => {
    localStorage.removeItem("selectedPairs");
    previouslySelected.clear();
    console.log("[JobFetcher] Cleared selected jobId-scheduleId list");
  }, 60 * 5000);
}


export const JobFetcher = (() => {
  let isActive = false;
  let appData = {};
  let cachedRequest = null;
  let hasRedirected = false;
  let schedulerRunning = false;

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  function playJobFoundAlert() {
    chrome.runtime.sendMessage({ type: "PLAY_SOUND" });
  }

  function redirectToApplication(jobId, scheduleId) {
    stop(); // Ensure nothing continues
    chrome.runtime.sendMessage({
      type: "JOB_FOUND_ACTIONS",
      openUrl: country.jobSearchUrl,
      jobId: jobId,
      scheduleId: scheduleId,
    });

    const url = `https://hiring.amazon.${country.tld}/application/${country.extld}/?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1#/consent?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1`;
    // window.location.href = url;
  }

  function updateAppData(data) {
    const relevantFields = [
      "centerOfCityCoordinates",
      "commuteDistance",
      "shiftPriorities",
      "otherCities",
      "shiftPrioritized",
      "cityPrioritized",
    ];
    const needsRebuild = relevantFields.some(
      (field) => JSON.stringify(data[field]) !== JSON.stringify(appData[field]),
    );
    appData = data;
    if (needsRebuild) {
      cachedRequest = JobProcessor.buildJobRequest(appData);
    }
    console.log(
      "[JobFetcher] appData updated:",
      JSON.stringify(appData, null, 2),
    );
  }

  async function runScheduler() {
    if (schedulerRunning) return; // Prevent double scheduler
    schedulerRunning = true;

    while (isActive) {
      if (!cachedRequest) {
        console.warn("[JobFetcher] No cached request — skipping fetch.");
        await delay(INTERVAL_MS);
        continue;
      }

      const controllers = Array.from(
        { length: FETCH_CONCURRENCY },
        () => new AbortController(),
      );
      const fetches = controllers.map((controller) =>
        JobProcessor.fetchGraphQL(cachedRequest, controller.signal),
      );

      let response = null;
      try {
        response = await Promise.any(fetches);
      } catch (err) {
        console.warn("[JobFetcher] All fetches failed or timed out.");
        chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
      }

      if (response) {
        const bestJob = JobProcessor.getBestJob(response, appData);
        if (bestJob) {
          console.log("[JobFetcher] Best job found:", bestJob);
          const schedule = await JobProcessor.getJobSchedule(bestJob.jobId, appData, previouslySelected);

          if (!schedule) {
            console.log(`[JobFetcher] All schedules exhausted for jobId=${bestJob.jobId}`);
            markJobIdAsExhausted(bestJob.jobId);
            continue;
          }


          if (schedule && !hasRedirected) {
            const key = `${bestJob.jobId}-${schedule.scheduleId}`;
            if (previouslySelected.has(key)) {
              console.log("[JobFetcher] Skipping previously selected job-schedule pair");
            } else {
              hasRedirected = true;
              previouslySelected.add(key);
              saveSelectedToStorage();

              controllers.forEach((c) => c.abort());
              playJobFoundAlert();
              console.log("Job ID:", bestJob.jobId, "Schedule ID:", schedule.scheduleId);
              redirectToApplication(bestJob.jobId, schedule.scheduleId);
              break;
            }
          }

        } else {
          console.log("[JobFetcher] No suitable job found.");
        }
      }

      await delay(INTERVAL_MS);
    }

    schedulerRunning = false;
  }

  function start() {
    if (isActive) return;
    isActive = true;
    hasRedirected = false;

    loadSelectedFromStorage();
    resetSelectedListEveryMinute();

    console.log("[JobFetcher] Starting job fetch loop");
    runScheduler();
  }


  function stop() {
    if (!isActive) return;
    isActive = false;
    console.log("[JobFetcher] Stopping job fetch loop");
  }

  // Preload cache
  updateAppData(appData);

  return {
    start,
    stop,
    updateAppData,
  };
})();
