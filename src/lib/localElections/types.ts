export const COMPILED_SOURCE_NAME = "Politeia compiled local dataset";
export const CENSUS_SOURCE_NAME = "U.S. Census Bureau";
export const CENSUS_SOURCE_URL =
  "https://www.census.gov/library/reference/code-lists/ansi/2020.html";
export const CENSUS_COUNTY_FILE_URL =
  "https://www2.census.gov/geo/docs/reference/codes2020/national_county2020.txt";
export const FEC_SOURCE_NAME = "U.S. Federal Election Commission";
export const FEC_SOURCE_URL =
  "https://www.fec.gov/help-candidates-and-committees/dates-and-deadlines/";
export const FEC_API_BASE = "https://api.open.fec.gov/v1";

export type SourceScope = "STATE" | "COUNTY";
export type SourceType = "OFFICIAL";
export type AdapterId = "census-counties" | "fec-statewide" | "compiled-overlay";
export type CoverageStatus = "FULL" | "PARTIAL" | "NONE";

export type LocalElectionSource = {
  stateCode: string;
  countySlug?: string;
  scope: SourceScope;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  enabled: boolean;
  adapter: AdapterId;
  notes?: string;
};

export type NormalizedCounty = {
  state: string;
  countyName: string;
  normalizedName: string;
  slug: string;
  sourceName: string;
  sourceUrl: string | null;
  lastVerified: Date | null;
};

export type NormalizedElection = {
  sourceKey: string;
  state: string;
  countySlug: string;
  electionName: string;
  electionType: string | null;
  electionDate: Date | null;
  office: string | null;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerified: Date | null;
  status: string;
};

export type NormalizedEvent = {
  sourceKey: string;
  state: string;
  countySlug: string;
  title: string;
  date: Date | null;
  description: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerified: Date | null;
};

export type AdapterResult = {
  adapter: AdapterId;
  stateCode: string;
  counties: NormalizedCounty[];
  elections: NormalizedElection[];
  events: NormalizedEvent[];
  emptyByDesign: boolean;
  missingFields: number;
  error?: string;
};

export type SyncOptions = {
  states?: string[];
  county?: string;
  dryRun?: boolean;
  force?: boolean;
  year?: number;
};

export type StateSyncCounts = {
  stateCode: string;
  countiesProcessed: number;
  electionsFetched: number;
  electionsInserted: number;
  electionsUpdated: number;
  electionsSkipped: number;
  eventsFetched: number;
  eventsInserted: number;
  eventsUpdated: number;
  missingFields: number;
  sourceFailures: string[];
  coverage: CoverageStatus;
};
