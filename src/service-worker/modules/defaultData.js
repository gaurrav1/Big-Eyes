export const DEFAULT_APP_DATA = {
    centerOfCityCoordinates: null,
    commuteDistance: 35,
    otherCities: [],
    shiftPrioritized: false, // NEW FIELD
    cityPrioritized: false, // NEW FIELD
    shiftPriorities: ["FLEX_TIME", "FULL_TIME", "PART_TIME", "REDUCED_TIME"],
    timestamp: Date.now(),
};