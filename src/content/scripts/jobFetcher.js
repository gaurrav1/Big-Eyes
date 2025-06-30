import { JobProcessor } from "./jobProcessor.js";
import { getCountry, setCountry } from "./model/country";

// setCountry({ name: "United States", tld: "com", extld: "us", locale: "en-US" });
let country = getCountry();

export const JobFetcher = (() => {
  let isActive = false;
  let appData = {};
  let intervalId = null;
  let cachedRequest = null;

  const start = () => {
    if (isActive) return;
    isActive = true;
    console.log("[JobFetcher] Starting job search");
    runScheduler();
  };

  const stop = () => {
    if (!isActive) return;
    isActive = false;
    console.log("[JobFetcher] Stopping job search");
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
  };

  function playJobFoundAlert() {
    // chrome.runtime.sendMessage({ type: "PLAY_ALERT_SOUND" });
    const audio = new Audio(chrome.runtime.getURL("sounds/captured.mp3"));
    audio.volume = 1.0;
    audio.play().catch(() => {});
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

      if (!cachedRequest) {
        console.warn("[JobFetcher] No cached request found, skipping fetch.");
        return;
      }

      controllers.forEach((controller, index) => {
        JobProcessor.fetchGraphQL(cachedRequest, controller.signal)
          .then(async (response) => {
            if (!response) {
              console.log(
                `[JobFetcher] Skipped response due to timeout or slowness`,
              );
              return;
            }

            if (found) return;
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

                stop();
              }
            }
          })
          .catch((err) => {
            if (err.name !== "AbortError") {
              console.error(
                `[FetchError] on index ${index}:`,
                err,
                JSON.stringify(err, Object.getOwnPropertyNames(err)),
              );
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

  const redirectToApplication = (jobId, scheduleId) => {
    stop();

    chrome.runtime.sendMessage({
      type: "JOB_FOUND_ACTIONS",
      jobId,
      scheduleId,
    });

    window.location.href = `https://hiring.amazon.${country.tld}/application/${country.extld}/?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1#/consent?CS=true&jobId=${jobId}&locale=${country.locale}&scheduleId=${scheduleId}&ssoEnabled=1`;
  };

  return {
    start,
    stop,
    updateAppData,
  };
})();
