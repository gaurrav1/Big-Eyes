let appData = {
    centerOfCityCoordinates: null,
    commuteDistance: 35,
    otherCities: [],
    shiftPriorities: ["Flex", "Full", "Part", "Reduced"],
    timestamp: 0
};

let isSearchActive = false;

// Persist state across service worker restarts
chrome.storage.local.get(['appData', 'isSearchActive'], (result) => {
    if (result.appData) appData = result.appData;
    if (result.isSearchActive !== undefined) isSearchActive = result.isSearchActive;
});


