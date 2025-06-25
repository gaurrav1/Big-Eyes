import axios from "axios";
const GRAPHQL_URL =
  "https://e5mquma77feepi2bdn4d6h3mpu.appsync-api.us-east-1.amazonaws.com/graphql";
const PRIORITY_WEIGHTS = { location: 0.6, shiftType: 0.4 };

export const JobProcessor = {
  getToday: () => new Date().toISOString().split("T")[0],

  buildJobRequest: (appData) => {
    const request = {
      operationName: "searchJobCardsByLocation",
      variables: {
        searchJobRequest: {
          locale: "en-US",
          country: "United States",
          pageSize: 100,
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
    "operationName": "searchScheduleCards",
    "variables": {
        "searchScheduleRequest": {
            "locale": "en-US",
            "country": "United States",
            "keyWords": "",
            "equalFilters": [],
            "containFilters": [
                {
                    "key": "isPrivateSchedule",
                    "val": [
                        "false"
                    ]
                }
            ],
            "rangeFilters": [],
            "orFilters": [],
            "dateFilters": [
                {
                    "key": "firstDayOnSite",
                    "range": {
                        "startDate": "2025-06-20"
                    }
                }
            ],
            "sorters": [
                {
                    "fieldName": "totalPayRateMax",
                    "ascending": "false"
                }
            ],
            "pageSize": 1000,
            "jobId": jobId
        }
    },
    "query": "query searchScheduleCards($searchScheduleRequest: SearchScheduleRequest!) {\n  searchScheduleCards(searchScheduleRequest: $searchScheduleRequest) {\n    nextToken\n    scheduleCards {\n      hireStartDate\n      address\n      basePay\n      bonusSchedule\n      city\n      currencyCode\n      dataSource\n      distance\n      employmentType\n      externalJobTitle\n      featuredSchedule\n      firstDayOnSite\n      hoursPerWeek\n      image\n      jobId\n      jobPreviewVideo\n      language\n      postalCode\n      priorityRank\n      scheduleBannerText\n      scheduleId\n      scheduleText\n      scheduleType\n      signOnBonus\n      state\n      surgePay\n      tagLine\n      geoClusterId\n      geoClusterName\n      siteId\n      scheduleBusinessCategory\n      totalPayRate\n      financeWeekStartDate\n      laborDemandAvailableCount\n      scheduleBusinessCategoryL10N\n      firstDayOnSiteL10N\n      financeWeekStartDateL10N\n      scheduleTypeL10N\n      employmentTypeL10N\n      basePayL10N\n      signOnBonusL10N\n      totalPayRateL10N\n      distanceL10N\n      requiredLanguage\n      monthlyBasePay\n      monthlyBasePayL10N\n      vendorKamName\n      vendorId\n      vendorName\n      kamPhone\n      kamCorrespondenceEmail\n      kamStreet\n      kamCity\n      kamDistrict\n      kamState\n      kamCountry\n      kamPostalCode\n      __typename\n    }\n    __typename\n  }\n}\n"
}),

  fetchGraphQL: async (request) => {
    const response = await axios.post(GRAPHQL_URL, request, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
        "Country": "United States",
        "Cache-Control": "no-cache",
        Pragma: "no-cache",
      },
      timeout: 2000,
    });
    return response.data;
  },

  getLocationPriority: (job, appData) => {
    if (!appData.centerOfCityCoordinates) return 1;
    if (job.distance <= 5) return 1.0;
    if (appData.otherCities?.includes(job.city)) return 0.7;
    if (job.distance <= appData.commuteDistance) return 0.4;
    return 0;
  },

  getShiftPriority: (job, appData) => {
    if (!appData.shiftPriorities?.length) return 1;
    const jobType = job.jobType || job.employmentType;
    const index = appData.shiftPriorities.indexOf(jobType);
    return index === -1 ? 0.3 : 1 - index * 0.2;
  },

  prioritizeJobs: (jobs, appData) => {
    return jobs
      .map((job) => {
        const locationScore = JobProcessor.getLocationPriority(job, appData);
        const shiftScore = JobProcessor.getShiftPriority(job, appData);
        return {
          ...job,
          score:
            locationScore * PRIORITY_WEIGHTS.location +
            shiftScore * PRIORITY_WEIGHTS.shiftType,
        };
      })
      .filter((job) => job.score > 0)
      .sort((a, b) => b.score - a.score);
  },

  getBestJob: (response, appData) => {
    const jobs = response?.data?.searchJobCardsByLocation?.jobCards;
    if (!jobs?.length) return null;
    if (jobs.length === 1) return jobs[0];
    return JobProcessor.prioritizeJobs(jobs, appData)[0];
  },

  getJobSchedule: async (jobId) => {
    const response = await JobProcessor.fetchGraphQL(
      JobProcessor.buildScheduleRequest(jobId),
    );
    return response?.data?.searchScheduleCards?.scheduleCards?.[0];
  },
};
