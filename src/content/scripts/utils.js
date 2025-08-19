// Rotation Queue for fair job selection
const ROTATION_QUEUE_KEY = "jobRotationQueue";

export function loadRotationQueue() {
    const raw = localStorage.getItem(ROTATION_QUEUE_KEY);
    try {
        return JSON.parse(raw || "[]");
    } catch {
        return [];
    }
}

export function saveRotationQueue(queue) {
    localStorage.setItem(ROTATION_QUEUE_KEY, JSON.stringify(queue));
}

export function updateRotationQueue(availableJobIds) {
    let queue = loadRotationQueue();

    // Remove jobs no longer available
    queue = queue.filter(jobId => availableJobIds.includes(jobId));

    // Add new jobs to end of queue
    const newJobs = availableJobIds.filter(jobId => !queue.includes(jobId));
    queue.push(...newJobs);

    saveRotationQueue(queue);
    return queue;
}

export function getNextJobFromRotation(availableJobIds, exhaustedPairs) {
    const queue = updateRotationQueue(availableJobIds);

    // Find first job in rotation that has available schedules
    for (let i = 0; i < queue.length; i++) {
        const jobId = queue[i];
        if (availableJobIds.includes(jobId)) {
            // Check if this job has any non-exhausted schedules
            const hasAvailableSchedule = !isJobCompletelyExhausted(jobId, exhaustedPairs);
            if (hasAvailableSchedule) {
                // Move this job to end of queue for next rotation
                queue.splice(i, 1);
                queue.push(jobId);
                saveRotationQueue(queue);
                return jobId;
            }
        }
    }
    return null;
}

function isJobCompletelyExhausted(jobId, exhaustedPairs) {
    // This would need to be enhanced to check if ALL schedules for a job are exhausted
    // For now, we'll be optimistic and assume there might be new schedules
    return false;
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

export function markPairAsExhausted(pairKey, durationMs = 60 * 1000) { // Reduced to 60 seconds
    const pairs = loadExhaustedPairs();
    pairs[pairKey] = Date.now() + durationMs;
    saveExhaustedPairs(pairs);
}

export function cleanExhaustedPairs() {
    const pairs = loadExhaustedPairs(); // Automatically cleans expired
    saveExhaustedPairs(pairs);
    return pairs;
}

// Cleanup and reset mechanisms
export function resetRotationIfStale(maxAgeMs = 10 * 60 * 1000) { // 10 minutes
    const lastUpdate = localStorage.getItem('rotationLastUpdate');
    const now = Date.now();

    if (!lastUpdate || (now - parseInt(lastUpdate)) > maxAgeMs) {
        localStorage.removeItem(ROTATION_QUEUE_KEY);
        localStorage.setItem('rotationLastUpdate', now.toString());
        console.log('[Rotation] Reset stale rotation queue');
    }
}

export function clearAllExhaustedData() {
    localStorage.removeItem(EXHAUSTED_PAIRS_KEY);
    localStorage.removeItem(ROTATION_QUEUE_KEY);
    localStorage.removeItem('rotationLastUpdate');
    console.log('[Cleanup] Cleared all exhausted data');
}
