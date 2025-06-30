import { JobProcessor } from "./jobProcessor.js";
import { getCountry, setCountry } from "./model/country";

setCountry({ name: "United States", tld: "com", extld: "us", locale: "en-US" });
const country = getCountry();

const INTERVAL_MS = 500;
const FETCH_CONCURRENCY = 5;

export const JobFetcher = (() => {
  let isActive = false;
  let appData = {};
  let cachedRequest = null;
  let hasRedirected = false;
  let schedulerRunning = false;

  const delay = (ms) => new Promise((res) => setTimeout(res, ms));

  function playJobFoundAlert() {
    const audio = new Audio(chrome.runtime.getURL("sounds/captured.mp3"));
    audio.volume = 1.0;
    audio.play().catch(() => {});
  }

  function redirectToApplication(jobId, scheduleId) {
    stop(); // Ensure nothing continues
    chrome.runtime.sendMessage({
      type: "JOB_FOUND_ACTIONS",
      jobId,
      scheduleId,
    });

    const url = `https://hiring.amazon.${country.tld}/application/${country.extld}/?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1#/consent?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1`;
    window.location.href = url;
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
          const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);
          if (schedule && !hasRedirected) {
            hasRedirected = true;
            controllers.forEach((c) => c.abort());
            playJobFoundAlert();
            redirectToApplication(bestJob.jobId, schedule.scheduleId);
            break; // exit loop
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
