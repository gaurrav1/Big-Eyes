const EXHAUSTED_JOB_KEY = "exhaustedJobIds";

export function loadExhaustedJobIds() {
    const raw = localStorage.getItem(EXHAUSTED_JOB_KEY);
    const now = Date.now();
    try {
        const parsed = JSON.parse(raw || "{}");
        // Filter out expired
        for (const jobId in parsed) {
            if (parsed[jobId] < now) delete parsed[jobId];
        }
        return parsed;
    } catch {
        return {};
    }
}

export function saveExhaustedJobIds(map) {
    localStorage.setItem(EXHAUSTED_JOB_KEY, JSON.stringify(map));
}

export function markJobIdAsExhausted(jobId, durationMs = 2 * 60 * 1000) {
    const exhausted = loadExhaustedJobIds();
    exhausted[jobId] = Date.now() + durationMs;
    saveExhaustedJobIds(exhausted);
}
