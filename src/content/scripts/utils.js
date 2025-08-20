/* global chrome */
// Polyfill for chrome.storage.local when running in non-extension (e.g., Node test) environment
let __memoryStore = {};
function createMemoryStorage(){
  return {
    async get(keys){
      if(Array.isArray(keys)){
        const out={};
        keys.forEach(k=>{ out[k]=__memoryStore[k]; });
        return out;
      } else if(typeof keys === 'string') {
        return { [keys]: __memoryStore[keys] };
      } else if(typeof keys === 'object') { // default values map
        const out={};
        Object.keys(keys).forEach(k=>{ out[k]= (__memoryStore[k]!==undefined?__memoryStore[k]:keys[k]); });
        return out;
      }
      return {};
    },
    async set(obj){
      Object.assign(__memoryStore,obj);
    },
    async remove(keys){
      const arr = Array.isArray(keys)? keys : [keys];
      arr.forEach(k=>{ delete __memoryStore[k]; });
    }
  }
}
if (typeof chrome === 'undefined') {
  globalThis.chrome = { storage: { local: createMemoryStorage() } };
}
const storageLocal = (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) ? chrome.storage.local : createMemoryStorage();

// Rotation Queue for fair job selection
const ROTATION_QUEUE_KEY = "jobRotationQueue";

export async function loadRotationQueue() {
    try {
        const result = await storageLocal.get([ROTATION_QUEUE_KEY]);
        return result[ROTATION_QUEUE_KEY] || [];
    } catch {
        return [];
    }
}

export async function saveRotationQueue(queue) {
    try {
        await storageLocal.set({ [ROTATION_QUEUE_KEY]: queue });
    } catch (error) {
        console.error('Failed to save rotation queue:', error);
    }
}

export async function updateRotationQueue(availableJobIds) {
    let queue = await loadRotationQueue();

    // Remove jobs no longer available
    queue = queue.filter(jobId => availableJobIds.includes(jobId));

    // Add new jobs to end of queue
    const newJobs = availableJobIds.filter(jobId => !queue.includes(jobId));
    queue.push(...newJobs);

    await saveRotationQueue(queue);
    return queue;
}

export async function getNextJobFromRotation(availableJobIds, exhaustedPairs) {
    const queue = await updateRotationQueue(availableJobIds);

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
                await saveRotationQueue(queue);
                return jobId;
            }
        }
    }
    return null;
}

function isJobCompletelyExhausted(_jobId, _exhaustedPairs) {
    return false;
}

// Exhausted Pairs
const EXHAUSTED_PAIRS_KEY = "exhaustedJobSchedulePairs";

export async function loadExhaustedPairs() {
    const now = Date.now();
    let pairsMap = {};
    try {
        const result = await storageLocal.get([EXHAUSTED_PAIRS_KEY]);
        const stored = result[EXHAUSTED_PAIRS_KEY] || {};

        // Filter out expired entries
        for (const [key, exp] of Object.entries(stored)) {
            if (exp > now) {
                pairsMap[key] = exp;
            }
        }

        // Update storage if any expired were removed
        if (Object.keys(pairsMap).length !== Object.keys(stored).length) {
            await storageLocal.set({ [EXHAUSTED_PAIRS_KEY]: pairsMap });
        }
        return pairsMap;
    } catch {
        return {};
    }
}

export async function saveExhaustedPairs(pairsMap) {
    try {
        await storageLocal.set({ [EXHAUSTED_PAIRS_KEY]: pairsMap });
    } catch (error) {
        console.error('Failed to save exhausted pairs:', error);
    }
}

export function markPairAsExhausted(pairKey, durationMs = 60 * 1000) { // Reduced to 60 seconds
    return markPairAsExhaustedEnhanced(pairKey, durationMs);
}

export async function cleanExhaustedPairs() {
    const pairs = await loadExhaustedPairs(); // Automatically cleans expired
    await saveExhaustedPairs(pairs);
    return pairs;
}

// Auto-refresh configuration
const AUTO_REFRESH_CONFIG = {
    CLEANUP_INTERVAL: 30 * 1000, // 30 seconds
    ROTATION_RESET_INTERVAL: 5 * 60 * 1000, // 5 minutes
    PAIR_EXHAUSTION_DURATION: 60 * 1000, // 60 seconds
    PERFORMANCE_LOG_INTERVAL: 60 * 1000, // 1 minute
    MAX_CLEANUP_RETRIES: 3,
    CLEANUP_BATCH_SIZE: 50
};

// Auto-refresh state management
let autoRefreshState = {
    cleanupIntervalId: null,
    performanceIntervalId: null,
    isRunning: false,
    lastCleanupTime: 0,
    cleanupCount: 0,
    errorCount: 0,
    performanceMetrics: {
        cleanupDuration: [],
        pairsProcessed: 0,
        rotationResets: 0
    }
};

// Production-ready logging system
const Logger = {
    info: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [INFO] ${message}`, data || '');
    },
    warn: (message, data = null) => {
        const timestamp = new Date().toISOString();
        console.warn(`[${timestamp}] [WARN] ${message}`, data || '');
    },
    error: (message, error = null) => {
        const timestamp = new Date().toISOString();
        console.error(`[${timestamp}] [ERROR] ${message}`, error || '');
        autoRefreshState.errorCount++;
    },
    performance: (operation, duration, details = null) => {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] [PERF] ${operation}: ${duration}ms`, details || '');
    }
};

// Enhanced cleanup with error handling and performance monitoring
export async function performComprehensiveCleanup() {
    const startTime = Date.now();
    let cleanedPairs = 0;

    try {
        Logger.info('Starting comprehensive cleanup');

        // Clean exhausted pairs
        const beforePairs = Object.keys(await loadExhaustedPairs()).length;
        const cleanedPairsResult = await cleanExhaustedPairs();
        const afterPairs = Object.keys(cleanedPairsResult).length;
        cleanedPairs = beforePairs - afterPairs;

        // Reset stale rotation if needed
        const rotationResetResult = await resetRotationIfStale(AUTO_REFRESH_CONFIG.ROTATION_RESET_INTERVAL);

        // Update performance metrics
        const duration = Date.now() - startTime;
        autoRefreshState.performanceMetrics.cleanupDuration.push(duration);
        autoRefreshState.performanceMetrics.pairsProcessed += cleanedPairs;
        autoRefreshState.lastCleanupTime = Date.now();
        autoRefreshState.cleanupCount++;

        // Keep only last 10 cleanup durations for memory efficiency
        if (autoRefreshState.performanceMetrics.cleanupDuration.length > 10) {
            autoRefreshState.performanceMetrics.cleanupDuration = 
                autoRefreshState.performanceMetrics.cleanupDuration.slice(-10);
        }

        Logger.performance('Comprehensive cleanup', duration, {
            cleanedPairs,
            totalPairsRemaining: afterPairs,
            rotationReset: rotationResetResult
        });

        return {
            success: true,
            cleanedPairs,
            duration,
            totalPairsRemaining: afterPairs
        };

    } catch (error) {
        const duration = Date.now() - startTime;
        Logger.error('Cleanup failed', error);

        return {
            success: false,
            error: error.message,
            duration,
            cleanedPairs: 0
        };
    }
}

// Auto-refresh manager
export const AutoRefreshManager = {
    start() {
        if (autoRefreshState.isRunning) {
            Logger.warn('Auto-refresh already running');
            return false;
        }

        try {
            Logger.info('Starting auto-refresh system', AUTO_REFRESH_CONFIG);

            // Start periodic cleanup
            autoRefreshState.cleanupIntervalId = setInterval(() => {
                performComprehensiveCleanup();
            }, AUTO_REFRESH_CONFIG.CLEANUP_INTERVAL);

            // Start performance monitoring
            autoRefreshState.performanceIntervalId = setInterval(() => {
                this.logPerformanceMetrics();
            }, AUTO_REFRESH_CONFIG.PERFORMANCE_LOG_INTERVAL);

            autoRefreshState.isRunning = true;
            Logger.info('Auto-refresh system started successfully');
            return true;

        } catch (error) {
            Logger.error('Failed to start auto-refresh system', error);
            this.stop(); // Cleanup on failure
            return false;
        }
    },

    stop() {
        if (!autoRefreshState.isRunning) {
            Logger.warn('Auto-refresh not running');
            return false;
        }

        try {
            if (autoRefreshState.cleanupIntervalId) {
                clearInterval(autoRefreshState.cleanupIntervalId);
                autoRefreshState.cleanupIntervalId = null;
            }

            if (autoRefreshState.performanceIntervalId) {
                clearInterval(autoRefreshState.performanceIntervalId);
                autoRefreshState.performanceIntervalId = null;
            }

            autoRefreshState.isRunning = false;
            Logger.info('Auto-refresh system stopped');
            return true;

        } catch (error) {
            Logger.error('Error stopping auto-refresh system', error);
            return false;
        }
    },

    restart() {
        Logger.info('Restarting auto-refresh system');
        this.stop();
        return this.start();
    },

    getStatus() {
        return {
            isRunning: autoRefreshState.isRunning,
            lastCleanupTime: autoRefreshState.lastCleanupTime,
            cleanupCount: autoRefreshState.cleanupCount,
            errorCount: autoRefreshState.errorCount,
            config: AUTO_REFRESH_CONFIG,
            metrics: autoRefreshState.performanceMetrics
        };
    },

    updateConfig(newConfig) {
        try {
            const oldConfig = { ...AUTO_REFRESH_CONFIG };
            Object.assign(AUTO_REFRESH_CONFIG, newConfig);

            Logger.info('Auto-refresh config updated', {
                old: oldConfig,
                new: AUTO_REFRESH_CONFIG
            });

            // Restart if running to apply new config
            if (autoRefreshState.isRunning) {
                this.restart();
            }

            return true;
        } catch (error) {
            Logger.error('Failed to update auto-refresh config', error);
            return false;
        }
    },

    logPerformanceMetrics() {
        const metrics = autoRefreshState.performanceMetrics;
        const avgCleanupTime = metrics.cleanupDuration.length > 0 
            ? metrics.cleanupDuration.reduce((a, b) => a + b, 0) / metrics.cleanupDuration.length 
            : 0;

        Logger.performance('Auto-refresh metrics', avgCleanupTime, {
            totalCleanups: autoRefreshState.cleanupCount,
            totalErrors: autoRefreshState.errorCount,
            pairsProcessed: metrics.pairsProcessed,
            rotationResets: metrics.rotationResets,
            avgCleanupTime: avgCleanupTime.toFixed(2) + 'ms',
            uptime: autoRefreshState.isRunning ? Date.now() - autoRefreshState.lastCleanupTime : 0
        });
    },

    forceCleanup() {
        Logger.info('Force cleanup requested');
        return performComprehensiveCleanup();
    }
};

// Enhanced cleanup and reset mechanisms
export async function resetRotationIfStale(maxAgeMs = AUTO_REFRESH_CONFIG.ROTATION_RESET_INTERVAL) {
    try {
        const result = await storageLocal.get(['rotationLastUpdate']);
        const lastUpdate = result.rotationLastUpdate;
        const now = Date.now();

        if (!lastUpdate || (now - parseInt(lastUpdate)) > maxAgeMs) {
            await storageLocal.remove([ROTATION_QUEUE_KEY]);
            await storageLocal.set({ 'rotationLastUpdate': now.toString() });
            autoRefreshState.performanceMetrics.rotationResets++;
            Logger.info('Reset stale rotation queue', { 
                lastUpdate: lastUpdate ? new Date(parseInt(lastUpdate)).toISOString() : 'never',
                maxAge: maxAgeMs 
            });
            return true;
        }
        return false;
    } catch (error) {
        Logger.error('Failed to reset rotation queue', error);
        return false;
    }
}

export async function clearAllExhaustedData() {
    try {
        const beforePairs = Object.keys(await loadExhaustedPairs()).length;
        const beforeQueue = (await loadRotationQueue()).length;

        await storageLocal.remove([EXHAUSTED_PAIRS_KEY, ROTATION_QUEUE_KEY, 'rotationLastUpdate']);

        Logger.info('Cleared all exhausted data', {
            clearedPairs: beforePairs,
            clearedQueueItems: beforeQueue
        });

        return {
            success: true,
            clearedPairs: beforePairs,
            clearedQueueItems: beforeQueue
        };
    } catch (error) {
        Logger.error('Failed to clear exhausted data', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Enhanced pair exhaustion with auto-refresh integration
export async function markPairAsExhaustedEnhanced(pairKey, durationMs = AUTO_REFRESH_CONFIG.PAIR_EXHAUSTION_DURATION) {
    try {
        const pairs = await loadExhaustedPairs();
        const expiryTime = Date.now() + durationMs;
        pairs[pairKey] = expiryTime;
        await saveExhaustedPairs(pairs);

        Logger.info('Pair marked as exhausted', {
            pairKey,
            expiryTime: new Date(expiryTime).toISOString(),
            duration: durationMs
        });

        // Trigger immediate cleanup if too many pairs
        const pairCount = Object.keys(pairs).length;
        if (pairCount > AUTO_REFRESH_CONFIG.CLEANUP_BATCH_SIZE) {
            Logger.warn('High pair count detected, triggering immediate cleanup', { pairCount });
            setTimeout(() => performComprehensiveCleanup(), 100);
        }

        return true;
    } catch (error) {
        Logger.error('Failed to mark pair as exhausted', error);
        return false;
    }
}
