let country = {
  name: "Canada",
  tld: "ca",
  extld: "ca",
  locale: "en-CA",
};

export function getCountry() {
  return country;
}

export function setCountry(newCountry) {
  country = newCountry;
}
