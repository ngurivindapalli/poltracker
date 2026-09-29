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
export const FEC_CANDIDATE_SOURCE_URL = "https://www.fec.gov/data/candidates/";
export const FEC_ELECTIONS_SOURCE_URL = "https://www.fec.gov/data/elections/";

export type SourceScope =
  | "STATE"
  | "COUNTY"
  | "CITY"
  | "TOWN"
  | "TOWNSHIP"
  | "SCHOOL_DISTRICT"
  | "OTHER_LOCAL";
export type SourceType = "OFFICIAL";
export type AdapterId =
  | "census-counties"
  | "fec-statewide"
  | "fec-contests"
  | "compiled-overlay"
  | "official-calendar"
  | "state-contests";

export type RecordKind = "ELECTION" | "CONTEST" | "MEASURE";
export type ContestCoverageStatus = "VERIFIED" | "PARTIAL" | "NOT_IMPLEMENTED";
export type CoverageStatus = "FULL" | "PARTIAL" | "NONE";
export type LayerCoverage = "COMPLETE" | "PARTIAL" | "LIMITED" | "NONE";
export type SourceInventoryStatus =
  | "VERIFIED"
  | "DISCOVERED"
  | "BLOCKED"
  | "PDF"
  | "UNAVAILABLE"
  | "NEEDS_MANUAL_REVIEW";
export type AccessMethod = "HTML" | "JSON" | "REST" | "CSV" | "PDF" | "UNKNOWN";

export type ElectionCategory =
  | "FEDERAL"
  | "STATE"
  | "COUNTY"
  | "MUNICIPAL"
  | "TOWN"
  | "TOWNSHIP"
  | "SCHOOL"
  | "JUDICIAL"
  | "SPECIAL"
  | "BALLOT_MEASURE"
  | "OTHER";

export type ElectionSubtype =
  | "PRIMARY"
  | "GENERAL"
  | "RUNOFF"
  | "SPECIAL"
  | "OTHER";

export type JurisdictionType =
  | "COUNTY"
  | "PARISH"
  | "BOROUGH"
  | "CENSUS_AREA"
  | "INDEPENDENT_CITY"
  | "CITY"
  | "TOWN"
  | "TOWNSHIP"
  | "VILLAGE"
  | "MUNICIPALITY"
  | "SCHOOL_DISTRICT"
  | "OTHER";

export type CalendarEventType =
  | "VOTER_REGISTRATION_DEADLINE"
  | "CANDIDATE_FILING_DEADLINE"
  | "ABSENTEE_APPLICATION_DEADLINE"
  | "MAIL_BALLOT_RETURN_DEADLINE"
  | "EARLY_VOTING_BEGINS"
  | "EARLY_VOTING_ENDS"
  | "ELECTION_DAY"
  | "RUNOFF_DATE"
  | "CERTIFICATION_DATE"
  | "CANVASS_DATE"
  | "ELECTION_BOARD_MEETING"
  | "PUBLIC_ELECTION_NOTICE"
  | "BALLOT_MEASURE_DEADLINE"
  | "OTHER";

export type LocalElectionSource = {
  stateCode: string;
  countySlug?: string;
  scope: SourceScope;
  sourceName: string;
  sourceUrl: string;
  sourceType: SourceType;
  enabled: boolean;
  adapter: AdapterId;
  batch?: number;
  parser?: string;
  notes?: string;
  calendarLayer?: "statewide" | "county" | "municipal" | "school";
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
  countySlug: string | null;
  electionName: string;
  electionType: string | null;
  electionCategory: ElectionCategory | null;
  subtype: ElectionSubtype | null;
  electionDate: Date | null;
  office: string | null;
  description: string | null;
  jurisdictionName: string | null;
  jurisdictionType: JurisdictionType | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerified: Date | null;
  status: string;
  recordKind?: RecordKind | null;
  district?: string | null;
  chamber?: string | null;
  externalId?: string | null;
};

export type NormalizedCandidate = {
  sourceKey: string;
  electionSourceKey: string;
  candidateName: string;
  candidateId: string | null;
  office: string | null;
  state: string | null;
  district: string | null;
  party: string | null;
  electionYears: string | null;
  candidateStatus: string | null;
  incumbent: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerified: Date | null;
};

export type NormalizedEvent = {
  sourceKey: string;
  state: string;
  countySlug: string | null;
  title: string;
  eventType: CalendarEventType | null;
  date: Date | null;
  endDate: Date | null;
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
  candidates?: NormalizedCandidate[];
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
  batch?: number;
  source?: "all" | "official" | "fec";
  level?: "federal" | "state" | "county";
  includeContests?: boolean;
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
  contestsFetched?: number;
  candidatesFetched?: number;
  contestsInserted?: number;
  contestsUpdated?: number;
  candidatesInserted?: number;
  candidatesUpdated?: number;
  missingFields: number;
  sourceFailures: string[];
  coverage: CoverageStatus;
};
