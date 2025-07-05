// modules/countryData.js

export const ALL_COUNTRY_DATA = [
    {
        code: "CA",
        country: "Canada",
        jobSearchUrl: "https://hiring.amazon.ca/app#/jobSearch",
        wildCardUrl: "*://*.hiring.amazon.ca/*",
    },
    {
        code: "US",
        country: "United States",
        jobSearchUrl: "https://hiring.amazon.com/app#/jobSearch",
        wildCardUrl: "*://*.hiring.amazon.com/*",
    },
];

export function getCountryData(code) {
    return ALL_COUNTRY_DATA.find((c) => c.code.toLowerCase() === code.toLowerCase());
}
