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
          locale: "en-CA",
          country: "Canada",
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
    operationName: "searchScheduleCards",
    variables: {
      searchScheduleRequest: { jobId, pageSize: 1 },
    },
    query: `query searchScheduleCards($searchScheduleRequest: SearchScheduleRequest!) {
            searchScheduleCards(searchScheduleRequest: $searchScheduleRequest) {
                scheduleCards { scheduleId }
            }
        }`,
  }),

  fetchGraphQL: async (request) => {
    const response = await axios.post(GRAPHQL_URL, request, {
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer token",
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
    return jobs?.length ? JobProcessor.prioritizeJobs(jobs, appData)[0] : null;
  },

  getJobSchedule: async (jobId) => {
    const response = await JobProcessor.fetchGraphQL(
      JobProcessor.buildScheduleRequest(jobId),
    );
    return response?.data?.searchScheduleCards?.scheduleCards?.[0];
  },
};
