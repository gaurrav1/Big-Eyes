let canadaData = {
    country: "Canada",
    jobSearchUrl: "https://hiring.amazon.ca/app#/jobSearch",
    wildCardUrl: "*://*.hiring.amazon.ca/*",
    wildCardJobSearchUrl: "*://*.hiring.amazon.ca/app#/jobSearch",
};

let usaData = {
    country: "United States",
    jobSearchUrl: "https://hiring.amazon.com/app#/jobSearch",
    wildCardUrl: "*://*.hiring.amazon.com/*",
    wildCardJobSearchUrl: "*://*.hiring.amazon.com/app#/jobSearch",
};

export function getCountryData(country) {
    if (country.toLowerCase() === "ca") {
        return canadaData;
    } else {
        return usaData;
    }
}
