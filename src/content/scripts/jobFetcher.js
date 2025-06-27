import { JobProcessor } from "./jobProcessor.js";

export const JobFetcher = (() => {
  let isActive = false;
  let appData = {};
  let intervalId = null;
  let cachedRequest = null;

  const start = () => {
    if (isActive) return;
    isActive = true;
    runScheduler();
  };

  const stop = () => {
    isActive = false;
    if (intervalId) clearInterval(intervalId);
    intervalId = null;
  };

  function playJobFoundAlert() {
    chrome.runtime.sendMessage({ type: "PLAY_ALERT_SOUND" });
  }

  const updateAppData = (data) => {
    // Only rebuild request if relevant fields change
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

    // Log the updated appData
    console.log(
      "[JobFetcher] appData updated:",
      JSON.stringify(appData, null, 2),
    );
  };
  // Highly optimized scheduler: minimal allocations, direct logic
  const runScheduler = () => {
    intervalId = setInterval(() => {
      if (!isActive || !cachedRequest) return;

      let found = false;
      const controllers = Array.from(
        { length: 5 },
        () => new AbortController(),
      );
      let pending = controllers.length;

      controllers.forEach((controller, index) => {
        JobProcessor.fetchGraphQL(cachedRequest, controller.signal)
          .then(async (response) => {
            if (found || !response) return;
            const bestJob = JobProcessor.getBestJob(response, appData);
            if (!bestJob) {
              console.log("[JobFetcher] No suitable job found by getBestJob.");
              return;
            }
            if (bestJob) {
              console.log("[JobFetcher] Best job found:", bestJob);

              const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);

              if (!schedule) {
                console.log(
                  "[JobFetcher] No schedule found for jobId:",
                  bestJob.jobId,
                );
                return;
              }
              if (schedule && !found) {
                found = true;
                controllers.forEach((c) => c.abort()); // Cancel others
                playJobFoundAlert();

                redirectToApplication(bestJob.jobId, schedule.scheduleId);

                stop(); // Stop scheduler
              }
            }
          })
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.error(`[FetchError] on index ${index}:`, err);
            }
          })
          .finally(() => {
            pending--;
            if (pending === 0 && !found) {
              chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
            }
          });
      });
    }, 300);
  };

  // Initialize cache on first run
  updateAppData(appData);

  const tld = "com";
  const extld = "us";
  const locale = "en-US";

  const redirectToApplication = (jobId, scheduleId) => {
    const url = `https://hiring.amazon.${tld}/application/${extld}/?CS=true&jobId=${jobId}&locale=${locale}&scheduleId=${scheduleId}&ssoEnabled=1#/consent?CS=true&jobId=${jobId}&locale=${locale}&scheduleId=${scheduleId}&ssoEnabled=1`;
    chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
    // window.location.href = url;
  };

  return {
    start,
    stop,
    updateAppData,
  };
})();
