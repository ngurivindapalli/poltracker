export const US_STATE_NAMES: Record<string, string> = {
  AL: "Alabama",
  AK: "Alaska",
  AZ: "Arizona",
  AR: "Arkansas",
  CA: "California",
  CO: "Colorado",
  CT: "Connecticut",
  DE: "Delaware",
  FL: "Florida",
  GA: "Georgia",
  HI: "Hawaii",
  ID: "Idaho",
  IL: "Illinois",
  IN: "Indiana",
  IA: "Iowa",
  KS: "Kansas",
  KY: "Kentucky",
  LA: "Louisiana",
  ME: "Maine",
  MD: "Maryland",
  MA: "Massachusetts",
  MI: "Michigan",
  MN: "Minnesota",
  MS: "Mississippi",
  MO: "Missouri",
  MT: "Montana",
  NE: "Nebraska",
  NV: "Nevada",
  NH: "New Hampshire",
  NJ: "New Jersey",
  NM: "New Mexico",
  NY: "New York",
  NC: "North Carolina",
  ND: "North Dakota",
  OH: "Ohio",
  OK: "Oklahoma",
  OR: "Oregon",
  PA: "Pennsylvania",
  RI: "Rhode Island",
  SC: "South Carolina",
  SD: "South Dakota",
  TN: "Tennessee",
  TX: "Texas",
  UT: "Utah",
  VT: "Vermont",
  VA: "Virginia",
  WA: "Washington",
  WV: "West Virginia",
  WI: "Wisconsin",
  WY: "Wyoming",
  DC: "District of Columbia",
};

const NAME_TO_CODE = Object.fromEntries(
  Object.entries(US_STATE_NAMES).map(([code, name]) => [
    name.toLowerCase(),
    code,
  ])
);

export function normalizeStateCode(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (/^[A-Za-z]{2}$/.test(trimmed)) {
    const code = trimmed.toUpperCase();
    return US_STATE_NAMES[code] ? code : null;
  }
  return NAME_TO_CODE[trimmed.toLowerCase()] || null;
}

export function extractStateFromText(text: string): string | null {
  const twoLetter = text.match(/\b([A-Z]{2})\b/);
  if (twoLetter && US_STATE_NAMES[twoLetter[1]]) return twoLetter[1];
  const lower = text.toLowerCase();
  for (const [name, code] of Object.entries(NAME_TO_CODE)) {
    if (lower.includes(name)) return code;
  }
  return null;
}
