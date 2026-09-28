import { CENSUS_COUNTY_FILE_URL, CENSUS_SOURCE_NAME, CENSUS_SOURCE_URL } from "../types";
import type { AdapterResult, NormalizedCounty } from "../types";
import { toCountyRecord } from "../normalize";
import { fetchOfficialText } from "../fetchOfficial";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";

export function parseCensusCountyFile(
  text: string,
  states?: string[]
): NormalizedCounty[] {
  const wanted = new Set((states || []).map((s) => s.toUpperCase()));
  const verified = new Date();
  const rows: NormalizedCounty[] = [];
  const seen = new Set<string>();
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || i === 0 && line.startsWith("STATE|")) continue;
    const parts = line.split("|");
    if (parts.length < 7) continue;
    const state = parts[0].trim().toUpperCase();
    const countyName = parts[4].trim();
    const funcstat = parts[6].trim().toUpperCase();
    if (!STATE_CODE_TO_NAME[state]) continue;
    if (wanted.size && !wanted.has(state)) continue;
    if (funcstat === "F") continue;
    if (!countyName) continue;
    const rec = toCountyRecord(state, countyName);
    const key = `${rec.state}:${rec.slug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    rows.push({
      ...rec,
      sourceName: CENSUS_SOURCE_NAME,
      sourceUrl: CENSUS_SOURCE_URL,
      lastVerified: verified,
    });
  }
  return rows;
}

export async function fetchCensusCounties(states: string[]): Promise<AdapterResult> {
  const result = await fetchOfficialText(CENSUS_COUNTY_FILE_URL);
  if (result.ok === false) {
    return {
      adapter: "census-counties",
      stateCode: states.join(","),
      counties: [],
      elections: [],
      events: [],
      emptyByDesign: false,
      missingFields: 0,
      error: result.error,
    };
  }
  const counties = parseCensusCountyFile(result.text, states);
  return {
    adapter: "census-counties",
    stateCode: states.join(","),
    counties,
    elections: [],
    events: [],
    emptyByDesign: counties.length === 0,
    missingFields: 0,
  };
}
