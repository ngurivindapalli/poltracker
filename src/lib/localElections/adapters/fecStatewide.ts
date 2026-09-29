import { countySlug } from "@/lib/localData/countySearch";
import { FEC_API_BASE, FEC_SOURCE_NAME, FEC_SOURCE_URL } from "../types";
import { fecApiKey } from "../fecAuth";
import type { AdapterResult, NormalizedElection } from "../types";
import { electionSourceKey, electionStatus, parseIsoDate } from "../normalize";
import { classifyElectionSubtype } from "../electionClassify";
import { fetchOfficialJson } from "../fetchOfficial";
import { toCountyRecord } from "../normalize";

type FecElectionDate = {
  election_date?: string | null;
  election_state?: string | null;
  election_type_full?: string | null;
  election_type_id?: string | null;
  election_year?: number | null;
  office_sought?: string | null;
  election_notes?: string | null;
};

type FecPage = {
  pagination?: { pages?: number; page?: number; count?: number };
  results?: FecElectionDate[];
};

export function normalizeFecStatewideDates(
  rows: FecElectionDate[],
  countySlugs: string[],
  verified: Date
): { elections: NormalizedElection[]; missingFields: number } {
  const unique = new Map<
    string,
    { date: Date; type: string; typeId: string; year: number; state: string; notes: string | null }
  >();
  let missingFields = 0;
  for (const row of rows) {
    const state = (row.election_state || "").toUpperCase();
    const date = parseIsoDate(row.election_date || undefined);
    const type = (row.election_type_full || "").trim();
    const typeId = (row.election_type_id || "").trim();
    if (!state || !date || !type) {
      missingFields += 1;
      continue;
    }
    const key = `${state}|${date.toISOString().slice(0, 10)}|${typeId || type}`;
    if (!unique.has(key)) {
      unique.set(key, {
        date,
        type,
        typeId: typeId || type,
        year: row.election_year || date.getUTCFullYear(),
        state,
        notes: row.election_notes || null,
      });
    }
  }

  const elections: NormalizedElection[] = [];
  for (const rec of unique.values()) {
    for (const slug of countySlugs) {
      elections.push({
        sourceKey: electionSourceKey([
          "fec",
          rec.state,
          rec.date.toISOString().slice(0, 10),
          rec.typeId,
          slug,
        ]),
        state: rec.state,
        countySlug: slug,
        electionName: `${rec.year} ${rec.type}`,
        electionType: rec.type,
        electionCategory: "FEDERAL",
        subtype: classifyElectionSubtype(rec.type),
        electionDate: rec.date,
        office: null,
        description:
          rec.notes ||
          "Federal election date reported by the U.S. Federal Election Commission for this state.",
        jurisdictionName: null,
        jurisdictionType: null,
        sourceName: FEC_SOURCE_NAME,
        sourceUrl: FEC_SOURCE_URL,
        lastVerified: verified,
        status: electionStatus(rec.date, verified),
      });
    }
  }
  return { elections, missingFields };
}

export async function fetchFecStatewideElections(
  stateCode: string,
  countyNames: string[],
  year: number
): Promise<AdapterResult> {
  const code = stateCode.toUpperCase();
  const apiKey = fecApiKey();
  if (!apiKey) {
    return {
      adapter: "fec-statewide",
      stateCode: code,
      counties: countyNames.map((name) => ({
        ...toCountyRecord(code, name),
        sourceName: FEC_SOURCE_NAME,
        sourceUrl: FEC_SOURCE_URL,
        lastVerified: null,
      })),
      elections: [],
      events: [],
      emptyByDesign: false,
      missingFields: 0,
      error: "FEC_API_KEY is not set",
    };
  }

  const results: FecElectionDate[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= 20) {
    const url = new URL(`${FEC_API_BASE}/election-dates/`);
    url.searchParams.set("api_key", apiKey);
    url.searchParams.set("election_year", String(year));
    url.searchParams.set("election_state", code);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const fetched = await fetchOfficialJson<FecPage>(url.toString());
    if (fetched.ok === false) {
      return {
        adapter: "fec-statewide",
        stateCode: code,
        counties: [],
        elections: [],
        events: [],
        emptyByDesign: false,
        missingFields: 0,
        error: fetched.error,
      };
    }
    results.push(...(fetched.data.results || []));
    pages = fetched.data.pagination?.pages || 1;
    page += 1;
  }

  const slugs = countyNames.map((name) => countySlug(name));
  const verified = new Date();
  const { elections, missingFields } = normalizeFecStatewideDates(results, slugs, verified);
  return {
    adapter: "fec-statewide",
    stateCode: code,
    counties: [],
    elections,
    events: [],
    emptyByDesign: results.length === 0,
    missingFields,
  };
}
