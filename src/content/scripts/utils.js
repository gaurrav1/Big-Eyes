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

// Exhausted Pairs
const EXHAUSTED_PAIRS_KEY = "exhaustedJobSchedulePairs";

export function loadExhaustedPairs() {
    const raw = localStorage.getItem(EXHAUSTED_PAIRS_KEY);
    const now = Date.now();
    let pairsMap = {};
    try {
        const stored = raw ? JSON.parse(raw) : {};
        // Filter out expired entries
        for (const [key, exp] of Object.entries(stored)) {
            if (exp > now) {
                pairsMap[key] = exp;
            }
        }
        // Update storage if any expired were removed
        if (Object.keys(pairsMap).length !== Object.keys(stored).length) {
            localStorage.setItem(EXHAUSTED_PAIRS_KEY, JSON.stringify(pairsMap));
        }
        return pairsMap;
    } catch {
        return {};
    }
}

export function saveExhaustedPairs(pairsMap) {
    localStorage.setItem(EXHAUSTED_PAIRS_KEY, JSON.stringify(pairsMap));
}

export function markPairAsExhausted(pairKey, durationMs = 2 * 60 * 1000) {
    const pairs = loadExhaustedPairs();
    pairs[pairKey] = Date.now() + durationMs;
    saveExhaustedPairs(pairs);
}

export function cleanExhaustedPairs() {
    const pairs = loadExhaustedPairs(); // Automatically cleans expired
    saveExhaustedPairs(pairs);
    return pairs;
}