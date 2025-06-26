import { JobProcessor } from "./jobProcessor.js";

export const JobFetcher = (() => {
  let isActive = false;
  let appData = {};
  let intervalId = null;

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

  const runScheduler = () => {
    intervalId = setInterval(async () => {
      if (!isActive) return;

      // Create 5 parallel requests
      const requests = Array(5).fill().map(() =>
          JobProcessor.fetchGraphQL(JobProcessor.buildJobRequest(appData))
              .catch(e => null)
      );

      // Process responses as they complete instead of waiting for all
      for (const request of requests) {
        try {
          const response = await request;
          if (!response) continue;

          const bestJob = JobProcessor.getBestJob(response, appData);
          if (bestJob) {
            const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);
            if (schedule) {
              playJobFoundAlert();
              redirectToApplication(bestJob.jobId, schedule.scheduleId);
              chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
              stop();
              return; // Exit immediately when job is found
            }
          }
        } catch (e) {
          // Handle individual request failures silently
        }
      }

      // Network error reporting
      if (requests.every(r => r === null)) {
        chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
      }
    }, 300);
  };

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
    updateAppData: (data) => {
      appData = data;
    },
  };
})();
