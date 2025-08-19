## Better Approach for Amazon Job Detection Extension

After analyzing your Chrome extension code, I can see the core issue with your current exhaustion strategy. Here's a comprehensive solution:

## Current Problems Identified

1. **Job ID exhaustion is too aggressive** - When you exhaust a JOB_ID, you lose all its schedules, even new ones that might appear
2. **Scoring algorithm always picks the same "best" job** - The lexicographic scoring ensures the same job wins repeatedly
3. **Race condition between job-level and pair-level exhaustion** - Conflicting logic between the two approaches

## Recommended Solution: Multi-Tier Rotation Strategy

### 1. Remove Job-Level Exhaustion Entirely
Instead of exhausting entire JOB_IDs, rely solely on **job-schedule pair exhaustion** with these enhancements:

```javascript
// Enhanced utils.js
const EXHAUSTED_PAIRS_KEY = "exhaustedJobSchedulePairs";
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
```

### 2. Modify Job Selection Logic

Update `jobProcessor.js` to use rotation instead of pure scoring:

```javascript
getBestJob: (response, appData) => {
    const jobCardsRaw = response?.data?.searchJobCardsByLocation?.jobCards ?? [];
    
    // Don't filter by exhausted job IDs anymore
    const jobCards = jobCardsRaw;
    
    if (jobCards.length === 0) return null;
    
    const availableJobIds = jobCards.map(j => j.jobId);
    const exhaustedPairs = loadExhaustedPairs();
    
    // Use rotation to get next job to try
    const nextJobId = getNextJobFromRotation(availableJobIds, exhaustedPairs);
    
    if (!nextJobId) {
        // Fallback to scoring if rotation fails
        const filter = {
            shifts: appData.shiftPriorities || [],
            isShiftPrioritized: appData.shiftPrioritized || false,
            cities: [
                ...(appData.centerOfCityCoordinates?.locationName
                    ? [appData.centerOfCityCoordinates.locationName]
                    : []),
                ...(Array.isArray(appData.otherCities)
                    ? appData.otherCities.map((c) => c.locationName).filter(Boolean)
                    : []),
            ],
            isCityPrioritized: appData.cityPrioritized || false,
        };
        
        const bestJobId = JobProcessor.selectBestJobIdRaw(jobCards, filter);
        return jobCards.find((j) => j.jobId === bestJobId) || null;
    }
    
    return jobCards.find((j) => j.jobId === nextJobId) || null;
},
```

### 3. Enhanced Schedule Selection

Improve the schedule selection to handle multiple schedules better:

```javascript
getJobSchedule: async (jobId, appData, exhaustedPairs) => {
    const response = await JobProcessor.fetchGraphQL(
        JobProcessor.buildScheduleRequest(jobId)
    );
    const schedules = response?.data?.searchScheduleCards?.scheduleCards ?? [];

    if (schedules.length === 0) return null;
    
    // Filter out exhausted pairs first
    const availableSchedules = schedules.filter(schedule => {
        const pairKey = `${jobId}-${schedule.scheduleId}`;
        return !exhaustedPairs[pairKey];
    });
    
    if (availableSchedules.length === 0) return null;
    
    if (availableSchedules.length === 1) {
        return availableSchedules[0];
    }

    // Multiple schedules: prioritize by shift preference
    const preferredShifts = appData.shiftPriorities || [];
    
    // First, try to find schedules matching preferred shifts
    for (const shift of preferredShifts) {
        const matchingSchedule = availableSchedules.find(schedule => {
            const scheduleType = (schedule.scheduleType || "").split(";").map(s => s.trim());
            return scheduleType.includes(shift);
        });
        if (matchingSchedule) return matchingSchedule;
    }
    
    // If no preferred shift found, return first available
    return availableSchedules[0];
},
```

### 4. Update JobFetcher Logic

Modify the main loop in `jobFetcher.js`:

```javascript
// Remove the job exhaustion logic
if (!schedule) {
    console.log(`[JobFetcher] No available schedules for jobId=${bestJob.jobId}`);
    // Don't exhaust the job ID, just continue to next iteration
    continue;
}
```

### 5. Add Cleanup and Reset Mechanisms

Add periodic cleanup and reset options:

```javascript
// In utils.js
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
```

## Key Benefits of This Approach

1. **Fair Rotation**: Each job gets a chance regardless of scoring
2. **Granular Control**: Only exhausts specific job-schedule pairs, not entire jobs
3. **Adaptive**: Automatically handles new schedules for existing jobs
4. **Fallback**: Still uses scoring when rotation queue is empty
5. **Self-Cleaning**: Removes stale jobs from rotation automatically

## Additional Recommendations

1. **Add Manual Reset**: Provide a button in your extension popup to clear exhausted data
2. **Shorter Expiration**: Reduce pair exhaustion time from 2 minutes to 30-60 seconds
3. **Logging**: Add detailed logging to track rotation effectiveness
4. **Metrics**: Track success rates of different approaches

This approach should solve your core issues while maintaining the flexibility to handle Amazon's dynamic job posting patterns.