import { JobProcessor } from './jobProcessor.js';

export const JobFetcher = (() => {
    let isActive = false;
    let appData = {};
    let backoffDelay = 1000;
    const BASE_INTERVAL = 1000;
    const MAX_BACKOFF = 30000;

    const start = () => {
        if (isActive) return;
        isActive = true;
        backoffDelay = 1000;
        runLoop();
    };

    const stop = () => {
        isActive = false;
    };

    const runLoop = async () => {
        if (!isActive) return;

        try {
            const request = JobProcessor.buildJobRequest(appData);
            const response = await JobProcessor.fetchGraphQL(request);
            const bestJob = JobProcessor.getBestJob(response, appData);

            if (bestJob) {
                const schedule = await JobProcessor.getJobSchedule(bestJob.jobId);
                if (schedule) {
                    redirectToApplication(bestJob.jobId, schedule.scheduleId);
                    chrome.runtime.sendMessage({ type: "TAB_REDIRECTED" });
                    stop();
                    return;
                }
            }

            if (isActive) {
                setTimeout(runLoop, BASE_INTERVAL + Math.random() * 500);
                backoffDelay = 1000;
            }
        } catch (error) {
            console.error("Fetch loop error:", error);
            if (isActive) {
                setTimeout(runLoop, backoffDelay);
                backoffDelay = Math.min(backoffDelay * 2, MAX_BACKOFF);
            }
        }
    };

    const redirectToApplication = (jobId, scheduleId) => {
        const url = `https://hiring.amazon.ca/application/ca/?CS=true&jobId=${jobId}&locale=en-CA&scheduleId=${scheduleId}&ssoEnabled=1#/consent`;
        window.location.href = url;
    };

    return {
        start,
        stop,
        updateAppData: (data) => { appData = data; }
    };
})();