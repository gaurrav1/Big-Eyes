/**
 * @param {Array<Object>} jobCards
 *   Raw array from response.data.searchJobCardsByLocation.jobCards
 * @param {Object} filter
 *   {
 *     shifts: string[],              // e.g. ["FULL_TIME","FLEX_TIME"]
 *     isShiftPrioritized: boolean,   // true = use order, false = just membership
 *     cities: string[],              // e.g. ["Richmond","Anchorage"]
 *     isCityPrioritized: boolean
 *   }
 * @returns {string}
 *   The best-matched jobId
 */
function selectBestJobIdRaw(jobCards, filter) {
  // Edge cases
  if (jobCards.length === 0)  return null;
  if (jobCards.length === 1)  return jobCards[0].jobId;
  if (!filter.shifts.length && !filter.cities.length) {
    return jobCards[0].jobId;
  }

  // Precompute “priority lookups”:
  //   if prioritized: map shift/city → its index in filter array
  //   if not prioritized: we only care about membership
  const shiftIndex = {};
  if (filter.isShiftPrioritized) {
    filter.shifts.forEach((s, i) => { shiftIndex[s] = i; });
  }
  const cityIndex = {};
  if (filter.isCityPrioritized) {
    filter.cities.forEach((c, i) => { cityIndex[c] = i; });
  }

  // Score each job and pick the one with the lexicographically smallest (shiftScore, cityScore, originalIndex)
  let best = { score: [Infinity, Infinity, Infinity], jobId: jobCards[0].jobId };

  jobCards.forEach((job, idx) => {
    // Shift score
    let shiftScore;
    if (filter.shifts.length === 0) {
      shiftScore = 0;                      // no shift filter
    } else if (filter.isShiftPrioritized) {
      shiftScore = shiftIndex[job.jobType] ?? Number.MAX_SAFE_INTEGER;
    } else {
      shiftScore = filter.shifts.includes(job.jobType) ? 0 : Number.MAX_SAFE_INTEGER;
    }

    // City score
    let cityScore;
    if (filter.cities.length === 0) {
      cityScore = 0;
    } else if (filter.isCityPrioritized) {
      cityScore = cityIndex[job.city] ?? Number.MAX_SAFE_INTEGER;
    } else {
      cityScore = filter.cities.includes(job.city) ? 0 : Number.MAX_SAFE_INTEGER;
    }

    const candidateScore = [shiftScore, cityScore, idx];
    // Compare lexicographically
    const better = candidateScore.some((v,i) => v < best.score[i])
                && candidateScore.every((v,i) => i===0 || v <= best.score[i]);
    if (better) {
      best = { score: candidateScore, jobId: job.jobId };
    }
  });

  return best.jobId;
}

// ——— Usage example ———
const resp = /* your fetched JSON */;
const jobCards = resp.data.searchJobCardsByLocation.jobCards;

const filter = {
  shifts:             ["FULL_TIME","FLEX_TIME"],
  isShiftPrioritized: true,
  cities:             ["Richmond","Anchorage"],
  isCityPrioritized:  false
};

console.log("Best match:", selectBestJobIdRaw(jobCards, filter));
