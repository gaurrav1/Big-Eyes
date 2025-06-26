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
  };
  // Highly optimized scheduler: minimal allocations, direct logic
  const runScheduler = () => {
    intervalId = setInterval(async () => {
      if (!isActive) return;
      if (!cachedRequest) return;

      // 5 parallel requests, process as soon as any returns a match
      let found = false;
      let pending = 5;
      for (let i = 0; i < 5; ++i) {
        JobProcessor.fetchGraphQL(cachedRequest)
          .then(async (response) => {
            if (found || !response) return;
            const bestJob = JobProcessor.getBestJob(response, appData);
            if (bestJob) {
              const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);
              if (schedule && !found) {
                found = true;
                playJobFoundAlert();
                redirectToApplication(bestJob.jobId, schedule.scheduleId);
                chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
                stop();
              }
            }
          })
          .catch(() => {})
          .finally(() => {
            pending--;
            if (pending === 0 && !found) {
              chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
            }
          });
      }
    }, 300);
  };

  // Initialize cache on first run
  updateAppData(appData);

  const tld = "com";
  const extld = "us";
  const locale = "en-US";

  const redirectToApplication = (jobId, scheduleId) => {
    const url = `https://hiring.amazon.${tld}/application/${extld}/?CS=true&jobId=${jobId}&locale=${locale}&scheduleId=${scheduleId}&ssoEnabled=1#/consent?CS=true&jobId=${jobId}&locale=${locale}&scheduleId=${scheduleId}&ssoEnabled=1`;
    window.location.href = url;
  };

  return {
    start,
    stop,
    updateAppData,
  };
})();
