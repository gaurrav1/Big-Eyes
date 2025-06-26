// --- 1. ShiftType “enum” ---
export const ShiftType = Object.freeze({
  FLEX_TIME: "FLEX_TIME",
  FULL_TIME: "FULL_TIME",
  PART_TIME: "PART_TIME",
  REDUCED_TIME: "REDUCED_TIME",
});

// --- 2. JobFilter DTO ---
export class JobFilter {
  /**
   * @param {ShiftType[]} shifts
   * @param {boolean}    isShiftPrioritized
   * @param {string[]}   cities
   * @param {boolean}    isCityPrioritized
   */
  constructor(
    shifts = [],
    isShiftPrioritized = false,
    cities = [],
    isCityPrioritized = false,
  ) {
    this.shifts = shifts;
    this.isShiftPrioritized = isShiftPrioritized;
    this.cities = cities;
    this.isCityPrioritized = isCityPrioritized;
  }
}

// --- 3. JobCard model (POJO) ---
export class JobCard {
  /**
   * @param {Object} raw
   * @param {string} raw.jobId
   * @param {ShiftType} raw.jobType
   * @param {string} raw.city
   * // ... other fields as needed
   */
  constructor(raw) {
    this.jobId = raw.jobId;
    this.jobType = raw.jobType;
    this.city = raw.city;
    // copy over any other props you need:
    // this.totalPayRateMin = raw.totalPayRateMin;
    // ...
  }
}

// --- 4. JobSelector class ---
export class JobSelector {
  /**
   * @param {JobCard[]} allJobs
   */
  constructor(allJobs = []) {
    this.allJobs = allJobs;
    this._buildIndexes();
  }

  // Build lookup maps: shift → [jobs], city → [jobs]
  _buildIndexes() {
    this.jobsByShift = new Map();
    this.jobsByCity = new Map();

    for (const job of this.allJobs) {
      // by shift
      if (!this.jobsByShift.has(job.jobType)) {
        this.jobsByShift.set(job.jobType, []);
      }
      this.jobsByShift.get(job.jobType).push(job);

      // by city
      if (!this.jobsByCity.has(job.city)) {
        this.jobsByCity.set(job.city, []);
      }
      this.jobsByCity.get(job.city).push(job);
    }
  }

  /**
   * Selects the best matching jobId given filters.
   * @param {JobFilter} filter
   * @returns {string} jobId
   */
  selectBestJobId(filter) {
    // Edge: only one job → immediate
    if (this.allJobs.length === 1) {
      return this.allJobs[0].jobId;
    }
    // Edge: no filters → default first
    if (!filter.shifts.length && !filter.cities.length) {
      return this.allJobs[0].jobId;
    }

    // Build per-dimension candidate lists
    const shiftCandidates = this._buildCandidates(
      filter.shifts,
      filter.isShiftPrioritized,
      this.jobsByShift,
    );
    const cityCandidates = this._buildCandidates(
      filter.cities,
      filter.isCityPrioritized,
      this.jobsByCity,
    );

    // Intersect or fallback
    const finalCandidates = this._intersectOrFallback(
      shiftCandidates,
      cityCandidates,
    );

    // Return top match or default
    return finalCandidates.length > 0
      ? finalCandidates[0].jobId
      : this.allJobs[0].jobId;
  }

  /**
   * @template K
   * @param {K[]} keys
   * @param {boolean} prioritized
   * @param {Map<K, JobCard[]>} indexMap
   * @returns {JobCard[]}
   */
  _buildCandidates(keys, prioritized, indexMap) {
    if (!keys.length) return [];

    if (prioritized) {
      // Preserve user’s order, allow duplicates
      return keys.flatMap((key) => indexMap.get(key) || []);
    } else {
      // Unprioritized: union & dedupe while preserving encounter order
      const seen = new Set();
      const out = [];
      for (const key of keys) {
        const bucket = indexMap.get(key) || [];
        for (const job of bucket) {
          if (!seen.has(job.jobId)) {
            seen.add(job.jobId);
            out.push(job);
          }
        }
      }
      return out;
    }
  }

  /**
   * @param {JobCard[]} a
   * @param {JobCard[]} b
   * @returns {JobCard[]}
   */
  _intersectOrFallback(a, b) {
    if (a.length && b.length) {
      const bSet = new Set(b.map((j) => j.jobId));
      return a.filter((j) => bSet.has(j.jobId));
    }
    return a.length ? a : b;
  }
}
