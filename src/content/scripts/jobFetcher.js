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
      const requests = Array(5)
        .fill()
        .map(() =>
          JobProcessor.fetchGraphQL(
            JobProcessor.buildJobRequest(appData),
          ).catch((e) => null),
        );

      const responses = await Promise.all(requests);

      if (responses.every((r) => r === null)) {
        chrome.runtime.sendMessage({ type: "NETWORK_ERROR" });
      }

      for (const response of responses) {
        if (!response) continue;

        const bestJob = JobProcessor.getBestJob(response, appData);
        if (bestJob) {
          const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);

          if (schedule) {
            playJobFoundAlert();
            redirectToApplication(bestJob.jobId, schedule.scheduleId);
            chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
            stop();
            return;
          }
        }
      }
    }, 500); // Run every 0.5s (10 reqs/sec)
  };

  const redirectToApplication = (jobId, scheduleId) => {
    const url = `https://hiring.amazon.com/application/us/?CS=true&jobId=${jobId}&locale=en-US&scheduleId=${scheduleId}&ssoEnabled=1#/consent`;
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
