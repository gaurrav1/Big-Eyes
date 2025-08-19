// Test script for rotation queue functionality
import { 
    loadRotationQueue, 
    saveRotationQueue, 
    updateRotationQueue, 
    getNextJobFromRotation,
    clearAllExhaustedData,
    markPairAsExhausted,
    loadExhaustedPairs
} from './src/content/scripts/utils.js';

console.log('Testing Rotation Queue Functionality...');

// Clear any existing data
clearAllExhaustedData();

// Test 1: Basic rotation queue operations
console.log('\n=== Test 1: Basic Queue Operations ===');
const testJobIds = ['job1', 'job2', 'job3'];
const queue = updateRotationQueue(testJobIds);
console.log('Initial queue:', queue);

// Test 2: Get next job from rotation
console.log('\n=== Test 2: Job Rotation ===');
const exhaustedPairs = {};
for (let i = 0; i < 5; i++) {
    const nextJob = getNextJobFromRotation(testJobIds, exhaustedPairs);
    console.log(`Iteration ${i + 1}: Selected job = ${nextJob}`);
    console.log('Current queue:', loadRotationQueue());
}

// Test 3: Test with exhausted pairs
console.log('\n=== Test 3: With Exhausted Pairs ===');
markPairAsExhausted('job1-schedule1');
markPairAsExhausted('job2-schedule1');
const updatedExhaustedPairs = loadExhaustedPairs();
console.log('Exhausted pairs:', Object.keys(updatedExhaustedPairs));

for (let i = 0; i < 3; i++) {
    const nextJob = getNextJobFromRotation(testJobIds, updatedExhaustedPairs);
    console.log(`With exhausted pairs - Iteration ${i + 1}: Selected job = ${nextJob}`);
}

// Test 4: Test queue update with new jobs
console.log('\n=== Test 4: Queue Update with New Jobs ===');
const newJobIds = ['job1', 'job2', 'job3', 'job4', 'job5'];
const updatedQueue = updateRotationQueue(newJobIds);
console.log('Updated queue with new jobs:', updatedQueue);

// Test 5: Test queue update with removed jobs
console.log('\n=== Test 5: Queue Update with Removed Jobs ===');
const reducedJobIds = ['job2', 'job4'];
const reducedQueue = updateRotationQueue(reducedJobIds);
console.log('Queue after removing jobs:', reducedQueue);

console.log('\n=== Test Complete ===');