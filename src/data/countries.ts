export const COUNTRY_CODES = [
  "JP",
  "AE",
  "GB",
  "DE",
  "SG",
  "FR",
  "MX",
  "IN",
  "IT",
  "TR",
  "US",
] as const;

export type CountryCode = (typeof COUNTRY_CODES)[number];

export type Country = {
  code: CountryCode;
  name: string;
  short: string;
  originCity: string;
  originLabel: string;
  authority: string;
  lat: number;
  lng: number;
};

export const COUNTRIES: Record<CountryCode, Country> = {
  JP: {
    code: "JP",
    name: "Japan",
    short: "Japan",
    originCity: "Tokyo",
    originLabel: "Tokyo",
    authority: "MHLW / Narcotics Control Department",
    lat: 35.68,
    lng: 139.69,
  },
  AE: {
    code: "AE",
    name: "United Arab Emirates",
    short: "UAE",
    originCity: "Dubai",
    originLabel: "Dubai",
    authority: "MOHAP / Emirates Drug Establishment",
    lat: 25.2,
    lng: 55.27,
  },
  GB: {
    code: "GB",
    name: "United Kingdom",
    short: "UK",
    originCity: "London",
    originLabel: "London",
    authority: "Home Office / MHRA",
    lat: 51.51,
    lng: -0.13,
  },
  DE: {
    code: "DE",
    name: "Germany",
    short: "Germany",
    originCity: "Berlin",
    originLabel: "Berlin",
    authority: "BfArM",
    lat: 52.52,
    lng: 13.41,
  },
  SG: {
    code: "SG",
    name: "Singapore",
    short: "Singapore",
    originCity: "Singapore",
    originLabel: "Singapore",
    authority: "Health Sciences Authority (HSA)",
    lat: 1.35,
    lng: 103.82,
  },
  FR: {
    code: "FR",
    name: "France",
    short: "France",
    originCity: "Paris",
    originLabel: "Paris",
    authority: "ANSM",
    lat: 48.86,
    lng: 2.35,
  },
  MX: {
    code: "MX",
    name: "Mexico",
    short: "Mexico",
    originCity: "Mexico City",
    originLabel: "Mexico City",
    authority: "COFEPRIS",
    lat: 19.43,
    lng: -99.13,
  },
  IN: {
    code: "IN",
    name: "India",
    short: "India",
    originCity: "Mumbai",
    originLabel: "Mumbai",
    authority: "CDSCO / NDPS authorities",
    lat: 19.08,
    lng: 72.88,
  },
  IT: {
    code: "IT",
    name: "Italy",
    short: "Italy",
    originCity: "Rome",
    originLabel: "Rome",
    authority: "AIFA / Ministry of Health",
    lat: 41.9,
    lng: 12.5,
  },
  TR: {
    code: "TR",
    name: "Turkey",
    short: "Turkey",
    originCity: "Istanbul",
    originLabel: "Istanbul",
    authority: "TİTCK",
    lat: 41.01,
    lng: 28.98,
  },
  US: {
    code: "US",
    name: "United States",
    short: "USA",
    originCity: "New York",
    originLabel: "New York",
    authority: "FDA / CBP / DEA",
    lat: 40.71,
    lng: -74.01,
  },
};

export const COUNTRY_LIST = COUNTRY_CODES.map((code) => COUNTRIES[code]);

export function isCountryCode(value: string): value is CountryCode {
  return (COUNTRY_CODES as readonly string[]).includes(value);
}

export function projectPoint(lat: number, lng: number) {
  const x = ((lng + 180) / 360) * 100;
  const y = ((90 - lat) / 180) * 100;
  return { x, y };
}
