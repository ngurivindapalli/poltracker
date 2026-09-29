/**
 * Audit of federal election data actually present in Politeia.
 * Congress.gov legislative records are separate and are not election-calendar records.
 */
export type FederalAuditRow = {
  category: string;
  currentSource: string;
  databaseRepresentation: string;
  coverage: string;
  missingPieces: string;
  recommendedSource: string;
  implementationStatus: "implemented" | "partial" | "not_implemented";
};

export const FEDERAL_ELECTION_AUDIT: FederalAuditRow[] = [
  {
    category: "Federal general and primary dates",
    currentSource: "U.S. Federal Election Commission election-dates API",
    databaseRepresentation:
      "LocalElection rows with electionCategory FEDERAL, fan-out to every Census county equivalent in the state",
    coverage: "50 states where FEC returned at least one dated record for the sync year",
    missingPieces:
      "These are statewide federal dates, not contest-level Senate, House, or presidential races",
    recommendedSource: "FEC /v1/election-dates/ (already used)",
    implementationStatus: "implemented",
  },
  {
    category: "Federal election deadlines",
    currentSource: "Official state calendars where a parser is enabled; not FEC election-dates",
    databaseRepresentation: "LocalEvent (registration, mail ballot, early voting, election day)",
    coverage: "Only states with a verified official calendar adapter (currently PA, TX, FL, CA, plus NYC city calendar)",
    missingPieces: "FEC election-dates does not populate LocalEvent deadline rows",
    recommendedSource: "Official state election authority calendars",
    implementationStatus: "partial",
  },
  {
    category: "U.S. Senate contests",
    currentSource: "U.S. Federal Election Commission /candidates/ API",
    databaseRepresentation:
      "LocalElection rows with recordKind CONTEST, electionCategory FEDERAL, office U.S. Senate, one row per state/year",
    coverage: "States where FEC candidate records include the sync-year Senate election",
    missingPieces: "Ballot qualification is not inferred from candidate_status",
    recommendedSource: "FEC /v1/candidates/?office=S",
    implementationStatus: "implemented",
  },
  {
    category: "U.S. House contests",
    currentSource: "U.S. Federal Election Commission /candidates/ API",
    databaseRepresentation:
      "LocalElection contest rows with state + district; LocalCandidate rows keyed by FEC candidate_id",
    coverage: "House districts where FEC returned a sync-year candidate with state and district",
    missingPieces: "House contests without a district in the FEC record are reported, not invented",
    recommendedSource: "FEC /v1/candidates/?office=H",
    implementationStatus: "implemented",
  },
  {
    category: "Presidential elections",
    currentSource: "U.S. Federal Election Commission /candidates/ API (office=P)",
    databaseRepresentation: "One national LocalElection contest per applicable cycle (countyId null, state US)",
    coverage: "Only when FEC candidate election_years include the sync year",
    missingPieces: "Midterm years typically have no presidential contest",
    recommendedSource: "FEC /v1/candidates/?office=P",
    implementationStatus: "implemented",
  },
  {
    category: "Federal special elections",
    currentSource: "FEC election-dates when election_type identifies a special election and office_sought is present",
    databaseRepresentation: "LocalElection FEDERAL contest with subtype SPECIAL",
    coverage: "Only if FEC reported a special election with enough office/jurisdiction fields",
    missingPieces: "House specials without a district in the official record are not created",
    recommendedSource: "FEC election-dates",
    implementationStatus: "implemented",
  },
  {
    category: "Congressional districts / Senate seats",
    currentSource: "Member/representative datasets, not local_elections",
    databaseRepresentation: "Not modeled on LocalElection",
    coverage: "District lists for current members are separate from election-calendar coverage",
    missingPieces: "Election-calendar linkage from district/seat to a dated contest",
    recommendedSource: "Keep Congress.gov / member data separate; add contests only from FEC or official ballots",
    implementationStatus: "not_implemented",
  },
  {
    category: "Federal ballot measures",
    currentSource: "None",
    databaseRepresentation: "Not applicable at the federal level in this schema",
    coverage: "0",
    missingPieces: "Federal ballot measures are not a standard FEC election-dates product",
    recommendedSource: "Official state ballots if a federal question appears there",
    implementationStatus: "not_implemented",
  },
];

export function formatFederalAudit(): string {
  const lines = ["FEDERAL ELECTION AUDIT", "======================", ""];
  for (const row of FEDERAL_ELECTION_AUDIT) {
    lines.push(
      `## ${row.category}`,
      `Source: ${row.currentSource}`,
      `Database: ${row.databaseRepresentation}`,
      `Coverage: ${row.coverage}`,
      `Missing: ${row.missingPieces}`,
      `Recommended source: ${row.recommendedSource}`,
      `Status: ${row.implementationStatus}`,
      ""
    );
  }
  return lines.join("\n");
}
