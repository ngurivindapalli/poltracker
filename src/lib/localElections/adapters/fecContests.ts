import {
  FEC_API_BASE,
  FEC_CANDIDATE_SOURCE_URL,
  FEC_ELECTIONS_SOURCE_URL,
  FEC_SOURCE_NAME,
  FEC_SOURCE_URL,
} from "../types";
import type { NormalizedCandidate, NormalizedElection } from "../types";
import { electionSourceKey, electionStatus, parseIsoDate } from "../normalize";
import { classifyElectionSubtype } from "../electionClassify";
import { fetchOfficialJson } from "../fetchOfficial";
import { fecApiKey } from "../fecAuth";

export type FecCandidateRow = {
  candidate_id?: string | null;
  name?: string | null;
  office?: string | null;
  office_full?: string | null;
  state?: string | null;
  district?: string | null;
  party?: string | null;
  party_full?: string | null;
  candidate_status?: string | null;
  incumbent_challenge?: string | null;
  incumbent_challenge_full?: string | null;
  election_years?: number[] | null;
  cycles?: number[] | null;
};

export type FecElectionDateRow = {
  election_date?: string | null;
  election_state?: string | null;
  election_type_full?: string | null;
  election_type_id?: string | null;
  election_year?: number | null;
  office_sought?: string | null;
  election_notes?: string | null;
};

type FecPage<T> = {
  pagination?: { pages?: number; page?: number; count?: number };
  results?: T[];
};

const SPECIAL_TYPE_IDS = new Set(["S", "SG", "SP", "SR", "R"]);

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function padDistrict(value: string | null | undefined): string | null {
  const raw = String(value || "").trim();
  if (!raw) return null;
  if (!/^\d+$/.test(raw)) return raw.toUpperCase();
  return raw.padStart(2, "0");
}

function officeSought(office: string | null | undefined): "P" | "S" | "H" | null {
  const value = (office || "").trim().toUpperCase();
  if (value === "P" || value === "PRESIDENT") return "P";
  if (value === "S" || value === "SENATE") return "S";
  if (value === "H" || value === "HOUSE") return "H";
  return null;
}

function officialOfficeName(office: "P" | "S" | "H"): string {
  if (office === "P") return "President of the United States";
  if (office === "S") return "U.S. Senate";
  return "U.S. House";
}

function contestTitle(office: "P" | "S" | "H", state: string, district: string | null): string {
  if (office === "P") return "President of the United States";
  if (office === "S") return `U.S. Senate — ${state}`;
  if (district === "00") return `U.S. House — ${state} At-Large`;
  return `U.S. House — ${state} District ${Number(district)}`;
}

function isSpecialType(typeId: string, typeFull: string): boolean {
  const id = typeId.trim().toUpperCase();
  if (SPECIAL_TYPE_IDS.has(id)) return true;
  return /\bspecial\b/i.test(typeFull);
}

function candidateAppliesToYear(row: FecCandidateRow, year: number): boolean {
  const years = Array.isArray(row.election_years) ? row.election_years : [];
  return years.includes(year);
}

function dateForContest(
  dates: FecElectionDateRow[],
  state: string | null,
  year: number,
  special: boolean
): { date: Date | null; type: string | null; typeId: string | null; notes: string | null } {
  const matching = dates.filter((row) => {
    const rowState = (row.election_state || "").toUpperCase();
    const rowYear = row.election_year || parseIsoDate(row.election_date || undefined)?.getUTCFullYear();
    if (rowYear !== year) return false;
    if (state && state !== "US" && rowState && rowState !== state && rowState !== "US") return false;
    const specialRow = isSpecialType(row.election_type_id || "", row.election_type_full || "");
    return special ? specialRow : !specialRow;
  });
  const preferred =
    matching.find((row) => /general/i.test(row.election_type_full || "") || (row.election_type_id || "").toUpperCase() === "G") ||
    matching.find((row) => /primary/i.test(row.election_type_full || "") || (row.election_type_id || "").toUpperCase() === "P") ||
    matching[0];
  if (!preferred) return { date: null, type: null, typeId: null, notes: null };
  return {
    date: parseIsoDate(preferred.election_date || undefined),
    type: (preferred.election_type_full || "").trim() || null,
    typeId: (preferred.election_type_id || "").trim() || null,
    notes: preferred.election_notes || null,
  };
}

export function fecContestSourceKey(input: {
  office: "P" | "S" | "H";
  state: string;
  district?: string | null;
  year: number;
  special?: boolean;
  date?: string | null;
  typeId?: string | null;
}): string {
  if (input.office === "P") {
    return electionSourceKey(["fec", "contest", "P", "US", String(input.year), input.special ? "special" : "cycle"]);
  }
  if (input.office === "S") {
    return electionSourceKey([
      "fec",
      "contest",
      "S",
      input.state,
      String(input.year),
      input.special ? "special" : "cycle",
      input.special ? input.date || "" : "",
      input.special ? input.typeId || "" : "",
    ]);
  }
  return electionSourceKey([
    "fec",
    "contest",
    "H",
    input.state,
    input.district || "",
    String(input.year),
    input.special ? "special" : "cycle",
    input.special ? input.date || "" : "",
    input.special ? input.typeId || "" : "",
  ]);
}

export function normalizeFecContests(
  candidates: FecCandidateRow[],
  dates: FecElectionDateRow[],
  year: number,
  verified: Date
): {
  contests: NormalizedElection[];
  candidates: NormalizedCandidate[];
  missingFields: number;
} {
  const contestMap = new Map<string, NormalizedElection>();
  const candidateMap = new Map<string, NormalizedCandidate>();
  let missingFields = 0;

  const addContest = (contest: NormalizedElection) => {
    if (!contestMap.has(contest.sourceKey)) contestMap.set(contest.sourceKey, contest);
  };

  for (const row of candidates) {
    if (!candidateAppliesToYear(row, year)) continue;
    const office = officeSought(row.office);
    const candidateId = (row.candidate_id || "").trim();
    if (!office || !candidateId) {
      missingFields += 1;
      continue;
    }
    const state = office === "P" ? "US" : (row.state || "").toUpperCase();
    const district = office === "H" ? padDistrict(row.district) : null;
    if (office === "S" && !state) {
      missingFields += 1;
      continue;
    }
    if (office === "H" && (!state || !district)) {
      missingFields += 1;
      continue;
    }
    const sourceKey = fecContestSourceKey({ office, state, district, year });
    const when = dateForContest(dates, office === "P" ? null : state, year, false);
    const officeName = (row.office_full || "").trim() || officialOfficeName(office);
    addContest({
      sourceKey,
      state,
      countySlug: null,
      electionName: contestTitle(office, state, district),
      electionType: when.type || `${year} election`,
      electionCategory: "FEDERAL",
      subtype: classifyElectionSubtype(when.type) || "GENERAL",
      electionDate: when.date,
      office: officeName,
      description: when.notes,
      jurisdictionName: office === "P" ? "United States" : state,
      jurisdictionType: null,
      sourceName: FEC_SOURCE_NAME,
      sourceUrl: FEC_ELECTIONS_SOURCE_URL,
      lastVerified: verified,
      status: electionStatus(when.date, verified),
      recordKind: "CONTEST",
      district: office === "H" ? district : null,
      chamber: office === "S" ? "U.S. Senate" : office === "H" ? "U.S. House" : null,
      externalId: sourceKey,
    });
    const candKey = electionSourceKey(["fec", "candidate", candidateId, sourceKey]);
    if (!candidateMap.has(candKey)) {
      candidateMap.set(candKey, {
        sourceKey: candKey,
        electionSourceKey: sourceKey,
        candidateName: (row.name || "").trim(),
        candidateId,
        office: officeName,
        state: office === "P" ? "US" : state,
        district: office === "H" ? district : null,
        party: (row.party_full || row.party || "").trim() || null,
        electionYears: Array.isArray(row.election_years) ? JSON.stringify(row.election_years) : null,
        candidateStatus: (row.candidate_status || "").trim() || null,
        incumbent: (row.incumbent_challenge_full || row.incumbent_challenge || "").trim() || null,
        sourceName: FEC_SOURCE_NAME,
        sourceUrl: FEC_CANDIDATE_SOURCE_URL,
        lastVerified: verified,
      });
    }
  }

  for (const row of dates) {
    const typeId = (row.election_type_id || "").trim();
    const typeFull = (row.election_type_full || "").trim();
    if (!isSpecialType(typeId, typeFull)) continue;
    const office = officeSought(row.office_sought);
    const state = (row.election_state || "").toUpperCase();
    const date = parseIsoDate(row.election_date || undefined);
    const rowYear = row.election_year || date?.getUTCFullYear();
    if (!office || !date || !rowYear) {
      missingFields += 1;
      continue;
    }
    if (office === "S" && !state) {
      missingFields += 1;
      continue;
    }
    let district: string | null = null;
    if (office === "H") {
      const noteDistrict = (row.election_notes || "").match(/\b(?:district|cd)\s*(\d{1,2})\b/i);
      district = padDistrict(noteDistrict?.[1] || null);
      if (!state || !district) {
        missingFields += 1;
        continue;
      }
    }
    const sourceKey = fecContestSourceKey({
      office,
      state: office === "P" ? "US" : state,
      district,
      year: rowYear,
      special: true,
      date: date.toISOString().slice(0, 10),
      typeId,
    });
    addContest({
      sourceKey,
      state: office === "P" ? "US" : state,
      countySlug: null,
      electionName: `${contestTitle(office, state, district)} (special)`,
      electionType: typeFull || "Special election",
      electionCategory: "FEDERAL",
      subtype: "SPECIAL",
      electionDate: date,
      office: officialOfficeName(office),
      description: row.election_notes || null,
      jurisdictionName: office === "P" ? "United States" : state,
      jurisdictionType: null,
      sourceName: FEC_SOURCE_NAME,
      sourceUrl: FEC_SOURCE_URL,
      lastVerified: verified,
      status: electionStatus(date, verified),
      recordKind: "CONTEST",
      district: office === "H" ? district : null,
      chamber: office === "S" ? "U.S. Senate" : office === "H" ? "U.S. House" : null,
      externalId: sourceKey,
    });
  }

  const namedCandidates = [...candidateMap.values()].filter((c) => c.candidateName);
  missingFields += [...candidateMap.values()].filter((c) => !c.candidateName).length;

  return {
    contests: [...contestMap.values()],
    candidates: namedCandidates,
    missingFields,
  };
}

async function fetchFecPages<T>(path: string, params: Record<string, string>, maxPages = 80): Promise<T[]> {
  const apiKey = fecApiKey();
  if (!apiKey) throw new Error("FEC_API_KEY is not set");
  const results: T[] = [];
  let page = 1;
  let pages = 1;
  while (page <= pages && page <= maxPages) {
    const url = new URL(`${FEC_API_BASE}${path}`);
    url.searchParams.set("api_key", apiKey);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    const fetched = await fetchOfficialJson<FecPage<T>>(url.toString());
    if (fetched.ok === false) throw new Error(fetched.error);
    results.push(...(fetched.data.results || []));
    pages = fetched.data.pagination?.pages || 1;
    page += 1;
    if (page <= pages) await sleep(800);
  }
  return results;
}

export async function fetchFecElectionDates(year: number): Promise<FecElectionDateRow[]> {
  const apiKey = fecApiKey();
  if (!apiKey) return [];
  const years = [year];
  if (year % 2 === 0) years.push(year - 1);
  const rows: FecElectionDateRow[] = [];
  for (const electionYear of years) {
    rows.push(
      ...(await fetchFecPages<FecElectionDateRow>("/election-dates/", {
        election_year: String(electionYear),
      }, 12))
    );
  }
  return rows;
}

export async function fetchFecContests(year: number): Promise<{
  contests: NormalizedElection[];
  candidates: NormalizedCandidate[];
  missingFields: number;
  error?: string;
}> {
  if (!fecApiKey()) {
    return { contests: [], candidates: [], missingFields: 0, error: "FEC_API_KEY is not set" };
  }
  try {
    const house = await fetchFecPages<FecCandidateRow>("/candidates/", { office: "H", cycle: String(year) });
    const senate = await fetchFecPages<FecCandidateRow>("/candidates/", { office: "S", cycle: String(year) });
    const president = await fetchFecPages<FecCandidateRow>("/candidates/", { office: "P", cycle: String(year) }, 20);
    const dates = await fetchFecElectionDates(year);
    const verified = new Date();
    return normalizeFecContests([...house, ...senate, ...president], dates, year, verified);
  } catch (err) {
    return {
      contests: [],
      candidates: [],
      missingFields: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
