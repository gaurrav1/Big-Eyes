let country = {
  name: "Canada",
  tld: "ca",
  extld: "ca",
  locale: "en-CA",
  jobSearchUrl: "https://hiring.amazon.ca/app#/jobSearch"
};

export function getCountry() {
  return country;
}

export function setCountry(newCountry) {
  country = newCountry;
}
