import type { JurisdictionType } from "./types";

export function jurisdictionTypeFromOfficialName(name: string): JurisdictionType {
  const value = name.trim();
  const lower = value.toLowerCase();
  if (/\bparish\b/.test(lower)) return "PARISH";
  if (/\bcensus area\b/.test(lower)) return "CENSUS_AREA";
  if (/\bmunicipality\b/.test(lower)) return "MUNICIPALITY";
  if (/\bcity and borough\b/.test(lower)) return "BOROUGH";
  if (/\bborough\b/.test(lower)) return "BOROUGH";
  if (/\btownship\b/.test(lower)) return "TOWNSHIP";
  if (/\bvillage\b/.test(lower)) return "VILLAGE";
  if (/\bcity\b/.test(lower) && !/\bcity and borough\b/.test(lower) && !/\bcity county\b/.test(lower)) {
    return "INDEPENDENT_CITY";
  }
  if (/\bcounty\b/.test(lower)) return "COUNTY";
  if (/\btown\b/.test(lower)) return "TOWN";
  if (/\bschools?\b/.test(lower)) return "SCHOOL_DISTRICT";
  return "OTHER";
}

export const NYC_COUNTY_SLUGS = [
  "bronx-county",
  "kings-county",
  "new-york-county",
  "queens-county",
  "richmond-county",
];
