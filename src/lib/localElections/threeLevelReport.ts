import { formatFederalAudit } from "./federalAudit";
import { PA_COUNTY_BOARD_SOURCES } from "./inventories/paCountyBoards";
import {
  stateAuthorityInventory,
  summarizeStateAuthorities,
} from "./inventories/stateAuthorities";
import { summarizeInventory } from "./inventory";
import type { StateCoverageRow } from "./audit";
import { ALL_STATE_CODES } from "./audit";
import { FEC_SOURCE_NAME } from "./types";

export function formatThreeLevelCoverageReport(rows: StateCoverageRow[]): string {
  const authorities = stateAuthorityInventory();
  const authoritySummary = summarizeStateAuthorities(authorities);
  const countyInventory = summarizeInventory(PA_COUNTY_BOARD_SOURCES);
  const expectedCounties = rows.reduce((n, r) => n + (r.expectedCountyCount || 0), 0);
  const federalElections = rows.reduce(
    (n, r) => n + (r.countiesWithFecElections > 0 ? r.countiesWithFecElections : 0),
    0
  );
  const federalElectionRecords = rows.reduce((n, r) => {
    return n + (r.officialSourceRecords - r.officialCountyElections);
  }, 0);
  const statewideCalendarCounties = rows.reduce((n, r) => n + r.countiesWithOfficialCalendar, 0);
  const countyVerifiedCounties = rows.reduce((n, r) => n + r.countiesWithCountySpecific, 0);
  const officialElections = rows.reduce((n, r) => n + r.officialSourceRecords, 0);
  const compiled = rows.reduce((n, r) => n + r.compiledRecords, 0);
  const events = rows.reduce((n, r) => n + r.eventCount, 0);
  const ballotMeasures = rows.reduce((n, r) => n + (r.officialBallotMeasures || 0), 0);
  const legislative = rows.reduce((n, r) => n + (r.officialLegislativeElections || 0), 0);
  const stateElections = rows.reduce((n, r) => n + (r.officialStateElections || 0), 0);
  const countyElections = rows.reduce((n, r) => n + r.officialCountyElections, 0);
  const countyEvents = rows.reduce((n, r) => n + (r.officialCountyEvents || 0), 0);
  const special = rows.reduce((n, r) => n + (r.officialSpecialElections || 0), 0);
  const duplicates = rows.reduce((n, r) => n + r.duplicateElections, 0);

  const lines = [
    "THREE-LEVEL ELECTION COVERAGE",
    "=============================",
    "",
    "FEDERAL",
    "-------",
    `Source: ${FEC_SOURCE_NAME} election-dates API`,
    "Federal authority coverage: 1 / 1",
    `States with FEC dates: ${rows.filter((r) => r.countiesWithFecElections > 0).length} / ${rows.length}`,
    `County equivalents with FEC dates: ${federalElections} / ${expectedCounties || "unknown"}`,
    "Federal contest records are counted separately in CONTEST COVERAGE (not election dates).",
    "",
    "STATE",
    "-----",
    `States: ${authoritySummary.states}`,
    `Official authorities discovered: ${authoritySummary.states} / 50`,
    `Official authorities verified (statewide calendar parsed): ${authoritySummary.verified} / 50`,
    `Discovered (directory only): ${authoritySummary.discovered}`,
    `Blocked: ${authoritySummary.blocked}`,
    `PDF/manual: ${authoritySummary.pdf + authoritySummary.needsManualReview}`,
    `Unavailable: ${authoritySummary.unavailable}`,
    `Statewide calendar counties: ${statewideCalendarCounties} / ${expectedCounties || "unknown"}`,
    `State office contests (governor, AG, etc.): ${stateElections}`,
    `State legislative contests: ${legislative}`,
    `Statewide ballot measures: ${ballotMeasures}`,
    `Special elections (from official records): ${special}`,
    "",
    "COUNTY",
    "------",
    `County equivalents (Census directory): ${expectedCounties || rows.reduce((n, r) => n + r.countyCount, 0)}`,
    `Official sources discovered (PA county boards): ${countyInventory.county} / ${expectedCounties || 3142}`,
    `Verified county calendars: ${countyInventory.verified}`,
    `Blocked: ${countyInventory.blocked}`,
    `PDF/manual: ${countyInventory.pdf + countyInventory.needsManualReview}`,
    `Unavailable: ${countyInventory.unavailable}`,
    `Counties with verified county-board calendar events: ${countyVerifiedCounties} / ${expectedCounties || "unknown"}`,
    `County election records: ${countyElections}`,
    `County-board event records: ${countyEvents}`,
    "Municipal and school coverage is out of scope for this report.",
    "",
    "DATABASE",
    "--------",
    `Official election records: ${officialElections}`,
    `Compiled election records: ${compiled}`,
    `Event records: ${events}`,
    `Duplicate election keys in audit: ${duplicates}`,
    "",
    formatFederalAudit(),
    "STATE AUTHORITY INVENTORY",
    "=========================",
    "state\tstateCode\tauthorityName\tsourceUrl\tsourceType\tsourceStatus\tsupportedCategories",
  ];
  for (const row of authorities) {
    lines.push(
      [
        row.state,
        row.stateCode,
        row.authorityName,
        row.sourceUrl,
        row.sourceType,
        row.sourceStatus,
        row.supportedCategories.join(","),
      ].join("\t")
    );
  }
  return lines.join("\n");
}

export function threeLevelJsonSummary(rows: StateCoverageRow[]) {
  const authorities = summarizeStateAuthorities();
  const countyInventory = summarizeInventory(PA_COUNTY_BOARD_SOURCES);
  return {
    federal: {
      authorityCoverage: "1/1",
      statesWithFecDates: rows.filter((r) => r.countiesWithFecElections > 0).length,
      states: ALL_STATE_CODES.length,
    },
    state: authorities,
    county: countyInventory,
    database: {
      officialElections: rows.reduce((n, r) => n + r.officialSourceRecords, 0),
      compiledElections: rows.reduce((n, r) => n + r.compiledRecords, 0),
      events: rows.reduce((n, r) => n + r.eventCount, 0),
    },
  };
}
