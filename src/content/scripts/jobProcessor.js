import {getCountry, setCountry} from "./model/country";
import {loadExhaustedJobIds} from "./utils.js";

const GRAPHQL_URL =
  "https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql";

if (window.location.href.includes("hiring.amazon.com")) {
  console.log("Hiring amazon.com");
  setCountry({ name: "United States", tld: "com", extld: "us", locale: "en-US" });
}
let country = getCountry();
console.log(country);

export const JobProcessor = {
  getToday: () => new Date().toISOString().split("T")[0],

  buildJobRequest: (appData) => {
    const request = {
      operationName: "searchJobCardsByLocation",
      variables: {
        searchJobRequest: {
          locale: country.locale,
          country: country.name,
          keyWords: "",
          dateFilters: [{key: "firstDayOnSite", range: {startDate: JobProcessor.getToday()}}],
          equalFilters: [{key: "scheduleRequiredLanguage", val: "en-US"}],
          containFilters: [{ key: "isPrivateSchedule", val: ["false"] }],
          rangeFilters: [
            { key: "hoursPerWeek", range: { minimum: 0, maximum: 80 } },
          ],
          sorters: [{ fieldName: "totalPayRateMax", ascending: "false" }],
          pageSize: 100,
          consolidateSchedule: true,
        },
      },
      query:
        "query searchJobCardsByLocation($searchJobRequest: SearchJobRequest!) {\n  searchJobCardsByLocation(searchJobRequest: $searchJobRequest) {\n  nextToken\n    jobCards {\n   jobId\n      jobTitle\n      jobType\n      locationName\n      distance\n    scheduleCount\n        __typename\n    }\n    __typename\n  }\n}\n",
    };

    if (appData.centerOfCityCoordinates) {
      request.variables.searchJobRequest.geoQueryClause = {
        lat: appData.centerOfCityCoordinates.lat,
        lng: appData.centerOfCityCoordinates.lng,
        unit: "km",
        distance: appData.commuteDistance || 35,
      };
    }

    return request;
  },

  buildScheduleRequest: (jobId) => ({
    operationName: "searchScheduleCards",
    variables: {
      searchScheduleRequest: {
        locale: country.locale,
        country: country.name,
        dateFilters: [
          {
            key: "firstDayOnSite",
            range: { startDate: JobProcessor.getToday() },
          },
        ],
        containFilters: [{ key: "isPrivateSchedule", val: ["false"] }],
        sorters: [{ fieldName: "totalPayRateMax", ascending: "false" }],
        pageSize: 1000,
        jobId,
      },
    },
    query:
      "query searchScheduleCards($searchScheduleRequest: SearchScheduleRequest!) {\n  searchScheduleCards(searchScheduleRequest: $searchScheduleRequest) {\n    nextToken\n    scheduleCards {\n         hoursPerWeek\n      jobId\n         scheduleId\n         scheduleType\n        __typename\n    }\n    __typename\n  }\n}\n",
  }),

  fetchGraphQL: async (request, externalSignal) => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // hard timeout in ms

    const signal = externalSignal ?? controller.signal;
    const start = performance.now();

    try {
      const response = await Promise.race([
        fetch(GRAPHQL_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer token",
            Country: country.name,
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
          },
          body: JSON.stringify(request),
          signal,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Request timed out")), 2000),
        ),
      ]);

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.error(`[fetchGraphQL] HTTP error ${response.status}`);
        return null;
      }

      const duration = performance.now() - start;
      if (duration > 2000) {
        console.warn(
          `[fetchGraphQL] Response too slow (${duration.toFixed(2)}ms), skipping`,
        );
        return null;
      }

      return await response.json();
    } catch (err) {
      const duration = performance.now() - start;
      console.error(
        `[fetchGraphQL] Failed in ${duration.toFixed(2)}ms:`,
        err.message,
      );
      return null;
    }
  },

  getBestJob: (response, appData) => {
    const jobCardsRaw = response?.data?.searchJobCardsByLocation?.jobCards ?? [];

    // Load exhausted jobIds from localStorage
    const exhausted = loadExhaustedJobIds();

    const jobCards = jobCardsRaw.filter(j => !exhausted[j.jobId]);

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

    console.log(`[JobScoring] filter=${JSON.stringify(filter)}`);
    const bestJobId = JobProcessor.selectBestJobIdRaw(jobCards, filter);
    return jobCards.find((j) => j.jobId === bestJobId) || null;
  },

  getJobSchedule: async (jobId, appData, previouslySelected) => {
    const response = await JobProcessor.fetchGraphQL(
        JobProcessor.buildScheduleRequest(jobId)
    );
    const schedules = response?.data?.searchScheduleCards?.scheduleCards ?? [];

    if (schedules.length === 0) return null;
    if (schedules.length === 1) {
      const pairKey = `${jobId}-${schedules[0].scheduleId}`;
      if (!previouslySelected.has(pairKey)) return schedules[0];
      return null;
    }

    // Multiple schedules: filter by shift
    const preferredShifts = appData.shiftPriorities || [];
    for (const schedule of schedules) {
      const pairKey = `${jobId}-${schedule.scheduleId}`;
      if (previouslySelected.has(pairKey)) continue;

      const scheduleType = (schedule.scheduleType || "").split(";").map(s => s.trim());
      const hasValidShift = scheduleType.some(s => preferredShifts.includes(s));
      if (hasValidShift) return schedule;
    }

    return null; // none matched
  },

  selectBestJobIdRaw: function (jobCards, filter) {
    // Edge cases
    if (jobCards.length === 0) return null;
    if (jobCards.length === 1) {
      const job = jobCards[0];
      const jobShifts = job.jobType.split(";").map(s => s.trim());

      const hasValidShift = jobShifts.some(s => filter.shifts.includes(s));

      if (!hasValidShift) {
        console.log("[JobScoring] Single job doesn't match required shift types");
        return null;
      }
      return job.jobId;
    }
    if (!filter.shifts.length && !filter.cities.length) {
      return jobCards[0].jobId;
    }

    // Precompute “priority lookups”:
    //   if prioritized: map shift/city → its index in filter array
    //   if not prioritized: we only care about membership
    const shiftIndex = {};
    if (filter.isShiftPrioritized) {
      filter.shifts.forEach((s, i) => {
        shiftIndex[s] = i;
      });
    }
    const cityIndex = {};
    if (filter.isCityPrioritized) {
      filter.cities.forEach((c, i) => {
        cityIndex[c] = i;
      });
    }

    // Score each job and pick the one with the lexicographically smallest (shiftScore, cityScore, originalIndex)
    let best = {
      score: [Infinity, Infinity, Infinity],
      jobId: jobCards[0].jobId,
    };

    jobCards.forEach((job, idx) => {
      // 1. Turn the semicolon-list into an actual array:
      const jobShifts = job.jobType.split(";").map((s) => s.trim());

      console.log("jobShifts:", jobShifts, "filter.shifts:", filter.shifts);


      // 2. Compute shiftScore:
      let shiftScore;
      if (filter.shifts.length === 0) {
        shiftScore = 0;
      } else if (filter.isShiftPrioritized) {
        // find the best (lowest) preference index among the job’s shifts
        shiftScore = jobShifts.reduce((best, s) => {
          const idx = shiftIndex[s]; // undefined if not in filter
          return idx !== undefined && idx < best ? idx : best;
        }, Number.MAX_SAFE_INTEGER);
      } else {
        // unprioritized: zero if any shift matches
        shiftScore = jobShifts.some((s) => filter.shifts.includes(s))
          ? 0
          : Number.MAX_SAFE_INTEGER;
      }
      // City score
      let cityScore;
      if (filter.cities.length === 0) {
        cityScore = 0;
      } else if (filter.isCityPrioritized) {
        cityScore = cityIndex[job.locationName] ?? Number.MAX_SAFE_INTEGER;
      } else {
        cityScore = filter.cities.includes(job.locationName)
          ? 0
          : Number.MAX_SAFE_INTEGER;
      }

      const candidateScore = [shiftScore, cityScore, idx];

      // Log all scoring details for this job
      console.log(
        `[JobScoring] idx=${idx}, jobId=${job.jobId}, jobTitle=${job.jobTitle}, jobShifts=${JSON.stringify(jobShifts)}, locationName=${job.locationName}, shiftScore=${shiftScore}, cityScore=${cityScore}, candidateScore=${JSON.stringify(candidateScore)}`,
      );

      // Compare lexicographically
      function lexLess(a, b) {
        for (let i = 0; i < a.length; ++i) {
          if (a[i] < b[i]) return true;
          if (a[i] > b[i]) return false;
        }
        return false;
      }

      // ... inside your forEach loop:
      if (lexLess(candidateScore, best.score)) {
        best = { score: candidateScore, jobId: job.jobId };
      }
    });

    // After loop, log the final selection
    console.log(
      `[JobScoring] Selected jobId=${best.jobId} with score=${JSON.stringify(best.score)}`,
    );
    // Fallback logic: If shiftScore was never improved, no job matches shifts
    if (best.score[0] === Number.MAX_SAFE_INTEGER && filter.shifts.length > 0) {
      for (const job of jobCards) {
        const jobShifts = job.jobType?.split(";").map((s) => s.trim()) ?? [];
        if (jobShifts.some((s) => filter.shifts.includes(s))) {
          console.log(
            "[JobScoring] Fallback selected job with valid shift:",
            job.jobId,
          );
          return job.jobId;
        }
      }
      console.log(
        "[JobScoring] No job matched required shift types in fallback.",
      );
      return null;
    }

    console.log(
      `[JobScoring] Selected jobId=${best.jobId} with score=${JSON.stringify(best.score)}`,
    );
    return best.jobId;
  },
};
