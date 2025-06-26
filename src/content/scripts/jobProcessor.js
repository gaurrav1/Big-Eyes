import axios from "axios";
const GRAPHQL_URL =
  "https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql";
export const JobProcessor = {
  getToday: () => new Date().toISOString().split("T")[0],

  buildJobRequest: (appData) => {
    const request = {
      operationName: "searchJobCardsByLocation",
      variables: {
        searchJobRequest: {
          locale: "en-US",
          country: "United States",
          pageSize: 1,
          dateFilters: [
            {
              key: "firstDayOnSite",
              range: { startDate: JobProcessor.getToday() },
            },
          ],
          sorters: [{ fieldName: "totalPayRateMax", ascending: "false" }],
        },
      },
      query: `query searchJobCardsByLocation($searchJobRequest: SearchJobRequest!) {
                searchJobCardsByLocation(searchJobRequest: $searchJobRequest) {
                    jobCards {
                        jobId
                        jobTitle
                        jobType
                        employmentType
                        city
                        state
                        distance
                        totalPayRateMax
                    }
                }
            }`,
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
        locale: "en-US",
        country: "United States",
        keyWords: "",
        equalFilters: [],
        containFilters: [
          {
            key: "isPrivateSchedule",
            val: ["false"],
          },
        ],
        rangeFilters: [],
        orFilters: [],
        dateFilters: [
          {
            key: "firstDayOnSite",
            range: {
              startDate: "2025-06-20",
            },
          },
        ],
        sorters: [
          {
            fieldName: "totalPayRateMax",
            ascending: "false",
          },
        ],
        pageSize: 1000,
        jobId: jobId,
      },
    },
    query:
      "query searchScheduleCards($searchScheduleRequest: SearchScheduleRequest!) {\n  searchScheduleCards(searchScheduleRequest: $searchScheduleRequest) {\n    nextToken\n    scheduleCards {\n      hireStartDate\n      address\n      basePay\n      bonusSchedule\n      city\n      currencyCode\n      dataSource\n      distance\n      employmentType\n      externalJobTitle\n      featuredSchedule\n      firstDayOnSite\n      hoursPerWeek\n      image\n      jobId\n      jobPreviewVideo\n      language\n      postalCode\n      priorityRank\n      scheduleBannerText\n      scheduleId\n      scheduleText\n      scheduleType\n      signOnBonus\n      state\n      surgePay\n      tagLine\n      geoClusterId\n      geoClusterName\n      siteId\n      scheduleBusinessCategory\n      totalPayRate\n      financeWeekStartDate\n      laborDemandAvailableCount\n      scheduleBusinessCategoryL10N\n      firstDayOnSiteL10N\n      financeWeekStartDateL10N\n      scheduleTypeL10N\n      employmentTypeL10N\n      basePayL10N\n      signOnBonusL10N\n      totalPayRateL10N\n      distanceL10N\n      requiredLanguage\n      monthlyBasePay\n      monthlyBasePayL10N\n      vendorKamName\n      vendorId\n      vendorName\n      kamPhone\n      kamCorrespondenceEmail\n      kamStreet\n      kamCity\n      kamDistrict\n      kamState\n      kamCountry\n      kamPostalCode\n      __typename\n    }\n    __typename\n  }\n}\n",
  }),

  fetchGraphQL: async (request) => {
    const response = await axios.post(GRAPHQL_URL, request, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
        Country: "United States",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      timeout: 2000,
    });
    return response.data;
  },

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
  selectBestJobIdRaw: function (jobCards, filter) {
    // Edge cases
    if (jobCards.length === 0) return null;
    if (jobCards.length === 1) return jobCards[0].jobId;
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
      const jobShifts = job.jobType.split(";");

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
        cityScore = cityIndex[job.city] ?? Number.MAX_SAFE_INTEGER;
      } else {
        cityScore = filter.cities.includes(job.city)
          ? 0
          : Number.MAX_SAFE_INTEGER;
      }

      const candidateScore = [shiftScore, cityScore, idx];
      // Compare lexicographically
      const better =
        candidateScore.some((v, i) => v < best.score[i]) &&
        candidateScore.every((v, i) => i === 0 || v <= best.score[i]);
      if (better) {
        best = { score: candidateScore, jobId: job.jobId };
      }
    });

    return best.jobId;
  },

  getBestJob: (response, appData) => {
    const jobCards = response?.data?.searchJobCardsByLocation?.jobCards;
    // Build filter object from appData
    const filter = {
      shifts: appData.shiftPriorities || [],
      isShiftPrioritized: appData.shiftPrioritized || false, // UPDATED
      cities: appData.otherCities || [],
      isCityPrioritized: appData.cityPrioritized || false,   // UPDATED
    };
    const bestJobId = JobProcessor.selectBestJobIdRaw(jobCards || [], filter);
    if (!bestJobId) return null;
    return (jobCards || []).find((j) => j.jobId === bestJobId) || null;
  },

  getJobSchedule: async (jobId) => {
    const response = await JobProcessor.fetchGraphQL(
      JobProcessor.buildScheduleRequest(jobId),
    );
    return response?.data?.searchScheduleCards?.scheduleCards?.[0];
  },
};
