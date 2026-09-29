import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { getPrisma } from "@/lib/db";
import { coverageFromCounts, layerCoverageFromCounts } from "./coverage";
import { COMPILED_SOURCE_NAME, FEC_SOURCE_NAME } from "./types";
import type { CoverageStatus, LayerCoverage } from "./types";
import { sourcesForState } from "./sources";
import { LOCAL_CALENDAR_SOURCES } from "./calendarSources";
import { fetchCensusCounties } from "./adapters/censusCounties";

export const ALL_STATE_CODES = Object.keys(STATE_CODE_TO_NAME).sort();

export type StateCoverageRow = {
  stateCode: string;
  countyCount: number;
  electionCount: number;
  eventCount: number;
  officialSourceRecords: number;
  compiledRecords: number;
  missingSourceUrls: number;
  missingSourceNames: number;
  duplicateCounties: number;
  duplicateElections: number;
  invalidStateCodes: number;
  oldestLastVerified: string | null;
  newestLastVerified: string | null;
  coverage: CoverageStatus;
  registryConfigured: boolean;
  countiesWithFecElections: number;
  countiesWithOfficialCalendar: number;
  countiesWithCountySpecific: number;
  countiesWithMunicipalElections: number;
  countiesWithSchoolElections: number;
  officialMunicipalElections: number;
  officialCountyElections: number;
  officialSchoolElections: number;
  compiledMunicipalElections: number;
  expectedCountyCount: number | null;
  jurisdictionCoverage: LayerCoverage;
  federalStatewideCoverage: LayerCoverage;
  localCalendarCoverage: LayerCoverage;
  countySpecificCoverage: LayerCoverage;
  municipalCalendarCoverage: LayerCoverage;
  schoolCalendarCoverage: LayerCoverage;
  officialCalendarSources: number;
  officialSources: number;
  officialStateElections: number;
  officialLegislativeElections: number;
  officialBallotMeasures: number;
  officialSpecialElections: number;
  officialCountyEvents: number;
};

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export async function auditLocalElectionCoverage(): Promise<StateCoverageRow[]> {
  const prisma = await getPrisma();
  const rows: StateCoverageRow[] = [];
  const expectedByState = new Map<string, number>();
  try {
    const census = await fetchCensusCounties(ALL_STATE_CODES);
    if (!census.error) {
      for (const county of census.counties) {
        expectedByState.set(county.state, (expectedByState.get(county.state) || 0) + 1);
      }
    }
  } catch {
    // Do not guess expected county counts if Census is unavailable.
  }

  for (const stateCode of ALL_STATE_CODES) {
    if (!prisma?.localCounty) {
      rows.push(emptyRow(stateCode));
      continue;
    }
    try {
      const counties = await prisma.localCounty.findMany({
        where: { state: stateCode },
        include: { elections: true, events: true },
      });
      const slugs = counties.map((c: any) => c.slug);
      const elections = counties.flatMap((c: any) => c.elections || []);
      const events = counties.flatMap((c: any) => c.events || []);
      const official = elections.filter(
        (e: any) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME
      );
      const compiled = elections.filter((e: any) => e.sourceName === COMPILED_SOURCE_NAME);
      const verified = [
        ...counties.map((c: any) => c.lastVerified),
        ...elections.map((e: any) => e.lastVerified),
        ...events.map((e: any) => e.lastVerified),
      ]
        .map((v) => iso(v))
        .filter((v): v is string => Boolean(v))
        .sort();
      const expectedCountyCount = expectedByState.get(stateCode) ?? null;
      const countiesWithOfficialElections = counties.filter((c: any) =>
        (c.elections || []).some(
          (e: any) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME
        )
      ).length;
      const countiesWithFecElections = counties.filter((c: any) =>
        (c.elections || []).some((e: any) => e.sourceName === FEC_SOURCE_NAME)
      ).length;
      const statewideCalendarNames = new Set(
        LOCAL_CALENDAR_SOURCES.filter((s) => (s.calendarLayer || "statewide") === "statewide").map(
          (s) => s.sourceName
        )
      );
      const officialCalendarNames = new Set(LOCAL_CALENDAR_SOURCES.map((s) => s.sourceName));
      const countiesWithOfficialCalendar = counties.filter((c: any) =>
        (c.events || []).some(
          (e: any) =>
            e.sourceName &&
            e.sourceName !== COMPILED_SOURCE_NAME &&
            statewideCalendarNames.has(e.sourceName)
        )
      ).length;
      const officialLocal = (e: any) =>
        e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME && e.sourceName !== FEC_SOURCE_NAME;
      const countiesWithCountySpecific = counties.filter((c: any) => {
        const countyElections = (c.elections || []).some(
          (e: any) => officialLocal(e) && e.electionCategory === "COUNTY"
        );
        const countyBoardEvents = (c.events || []).some(
          (e: any) =>
            officialLocal(e) && e.sourceName && !officialCalendarNames.has(e.sourceName)
        );
        return countyElections || countyBoardEvents;
      }).length;
      const countiesWithMunicipalElections = counties.filter((c: any) =>
        (c.elections || []).some(
          (e: any) =>
            officialLocal(e) &&
            (e.electionCategory === "MUNICIPAL" ||
              e.electionCategory === "TOWN" ||
              e.electionCategory === "TOWNSHIP")
        )
      ).length;
      const countiesWithSchoolElections = counties.filter((c: any) =>
        (c.elections || []).some((e: any) => officialLocal(e) && e.electionCategory === "SCHOOL")
      ).length;
      const officialCountyElections = elections.filter(
        (e: any) => officialLocal(e) && e.electionCategory === "COUNTY"
      ).length;
      const officialMunicipalElections = elections.filter(
        (e: any) =>
          officialLocal(e) &&
          (e.electionCategory === "MUNICIPAL" ||
            e.electionCategory === "TOWN" ||
            e.electionCategory === "TOWNSHIP")
      ).length;
      const officialSchoolElections = elections.filter(
        (e: any) => officialLocal(e) && e.electionCategory === "SCHOOL"
      ).length;
      const compiledMunicipalElections = compiled.filter(
        (e: any) => e.electionCategory === "MUNICIPAL"
      ).length;
      const officialStateElections = elections.filter(
        (e: any) =>
          officialLocal(e) &&
          e.electionCategory === "STATE" &&
          !/state (senate|house|assembly)|house of delegates|general assembly/i.test(
            `${e.electionName || ""} ${e.office || ""}`
          )
      ).length;
      const officialLegislativeElections = elections.filter((e: any) =>
        /state (senate|house|assembly)|house of delegates|general assembly/i.test(
          `${e.electionName || ""} ${e.office || ""} ${e.electionType || ""}`
        )
      ).length;
      const officialBallotMeasures = elections.filter(
        (e: any) => officialLocal(e) && e.electionCategory === "BALLOT_MEASURE"
      ).length;
      const officialSpecialElections = elections.filter(
        (e: any) =>
          officialLocal(e) &&
          (e.subtype === "SPECIAL" || e.electionCategory === "SPECIAL")
      ).length;
      const officialCountyEvents = events.filter(
        (e: any) =>
          officialLocal(e) && e.sourceName && !officialCalendarNames.has(e.sourceName)
      ).length;
      const officialSources = new Set(
        [...elections, ...events]
          .filter((e: any) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME)
          .map((e: any) => e.sourceName as string)
      ).size;
      const layers = layerCoverageFromCounts({
        countyCount: counties.length,
        expectedCountyCount,
        countiesWithFecElections,
        countiesWithOfficialCalendar,
        countiesWithCountySpecificCalendars: countiesWithCountySpecific,
        countiesWithMunicipalElections,
        countiesWithSchoolElections,
      });
      const coverage = coverageFromCounts({
        countyCount: counties.length,
        expectedCountyCount,
        officialElectionCount: official.length,
        compiledElectionCount: compiled.length,
        eventCount: events.length,
        countiesWithOfficialElections,
      });
      const electionKeys = elections.map(
        (e: any) => e.sourceKey || `${e.electionName}|${String(e.electionDate)}`
      );
      rows.push({
        stateCode,
        countyCount: counties.length,
        electionCount: elections.length,
        eventCount: events.length,
        officialSourceRecords: official.length,
        compiledRecords: compiled.length,
        missingSourceUrls: official.filter((e: any) => !e.sourceUrl).length,
        missingSourceNames: elections.filter((e: any) => !e.sourceName).length,
        duplicateCounties: slugs.length - new Set(slugs).size,
        duplicateElections: electionKeys.length - new Set(electionKeys).size,
        invalidStateCodes: counties.filter((c: any) => c.state !== stateCode).length,
        oldestLastVerified: verified[0] || null,
        newestLastVerified: verified[verified.length - 1] || null,
        coverage: counties.length || elections.length || events.length ? coverage : "NONE",
        registryConfigured: sourcesForState(stateCode).some((s) => s.enabled),
        countiesWithFecElections,
        countiesWithOfficialCalendar,
        countiesWithCountySpecific,
        countiesWithMunicipalElections,
        countiesWithSchoolElections,
        officialMunicipalElections,
        officialCountyElections,
        officialSchoolElections,
        compiledMunicipalElections,
        expectedCountyCount,
        ...layers,
        officialCalendarSources: LOCAL_CALENDAR_SOURCES.filter((s) => s.stateCode === stateCode && s.enabled)
          .length,
        officialSources,
        officialStateElections,
        officialLegislativeElections,
        officialBallotMeasures,
        officialSpecialElections,
        officialCountyEvents,
      });
    } catch {
      rows.push(emptyRow(stateCode));
    }
  }
  return rows;
}

function emptyRow(stateCode: string): StateCoverageRow {
  return {
    stateCode,
    countyCount: 0,
    electionCount: 0,
    eventCount: 0,
    officialSourceRecords: 0,
    compiledRecords: 0,
    missingSourceUrls: 0,
    missingSourceNames: 0,
    duplicateCounties: 0,
    duplicateElections: 0,
    invalidStateCodes: 0,
    oldestLastVerified: null,
    newestLastVerified: null,
    coverage: "NONE",
    registryConfigured: sourcesForState(stateCode).some((s) => s.enabled),
    countiesWithFecElections: 0,
    countiesWithOfficialCalendar: 0,
    countiesWithCountySpecific: 0,
    countiesWithMunicipalElections: 0,
    countiesWithSchoolElections: 0,
    officialMunicipalElections: 0,
    officialCountyElections: 0,
    officialSchoolElections: 0,
    compiledMunicipalElections: 0,
    expectedCountyCount: null,
    jurisdictionCoverage: "NONE",
    federalStatewideCoverage: "NONE",
    localCalendarCoverage: "NONE",
    countySpecificCoverage: "NONE",
    municipalCalendarCoverage: "NONE",
    schoolCalendarCoverage: "NONE",
    officialCalendarSources: LOCAL_CALENDAR_SOURCES.filter((s) => s.stateCode === stateCode && s.enabled)
      .length,
    officialSources: 0,
    officialStateElections: 0,
    officialLegislativeElections: 0,
    officialBallotMeasures: 0,
    officialSpecialElections: 0,
    officialCountyEvents: 0,
  };
}

export function formatCoverageReport(rows: StateCoverageRow[]): string {
  const pad = (value: string | number, n: number) => String(value).padEnd(n);
  const lines = [
    "LOCAL ELECTION COVERAGE",
    "=======================",
    "",
    `${pad("State", 8)}${pad("Counties", 11)}${pad("Elections", 12)}${pad("Events", 9)}${pad("Official", 11)}${pad("Compiled", 11)}${pad("MissingURL", 12)}${pad("Coverage", 10)}Verified`,
  ];
  for (const row of rows) {
    const verified =
      row.oldestLastVerified || row.newestLastVerified
        ? `${row.oldestLastVerified?.slice(0, 10) || "—"} … ${row.newestLastVerified?.slice(0, 10) || "—"}`
        : "—";
    lines.push(
      `${pad(row.stateCode, 8)}${pad(row.countyCount, 11)}${pad(row.electionCount, 12)}${pad(row.eventCount, 9)}${pad(row.officialSourceRecords, 11)}${pad(row.compiledRecords, 11)}${pad(row.missingSourceUrls, 12)}${pad(row.coverage, 10)}${verified}`
    );
  }
  const totals = rows.reduce(
    (acc, row) => {
      acc.counties += row.countyCount;
      acc.elections += row.electionCount;
      acc.events += row.eventCount;
      acc.official += row.officialSourceRecords;
      acc.compiled += row.compiledRecords;
      acc.missingUrls += row.missingSourceUrls;
      if (row.coverage === "FULL") acc.full += 1;
      else if (row.coverage === "PARTIAL") acc.partial += 1;
      else acc.none += 1;
      return acc;
    },
    {
      counties: 0,
      elections: 0,
      events: 0,
      official: 0,
      compiled: 0,
      missingUrls: 0,
      full: 0,
      partial: 0,
      none: 0,
    }
  );
  lines.push(
    "",
    `FULL: ${totals.full}  PARTIAL: ${totals.partial}  NONE: ${totals.none}`,
    `Totals: ${totals.counties} counties, ${totals.elections} elections, ${totals.events} events, ${totals.official} official, ${totals.compiled} compiled, ${totals.missingUrls} missing official source URLs`,
    "",
    formatLayerCoverageReport(rows)
  );
  return lines.join("\n");
}

function ratio(count: number, expected: number | null): string {
  return expected != null ? `${count} / ${expected}` : String(count);
}

export function formatLayerCoverageReport(rows: StateCoverageRow[]): string {
  const lines = ["LOCAL CALENDAR COVERAGE", "======================="];
  for (const row of rows) {
    const expected = row.expectedCountyCount;
    const name = STATE_CODE_TO_NAME[row.stateCode] || row.stateCode;
    lines.push(
      "",
      `## ${name}`,
      "",
      `County equivalents: ${ratio(row.countyCount, expected)}`,
      "",
      "Statewide/Federal:",
      ratio(row.countiesWithFecElections, expected),
      "",
      "Statewide calendar:",
      `${ratio(row.countiesWithOfficialCalendar, expected)} (${row.localCalendarCoverage})`,
      "",
      "County-specific:",
      `${ratio(row.countiesWithCountySpecific, expected)} (${row.countySpecificCoverage})`,
      "",
      "Municipal:",
      `${row.officialMunicipalElections} official election records (no statewide municipal directory)`,
      row.compiledMunicipalElections
        ? `Compiled municipal records: ${row.compiledMunicipalElections}`
        : "Compiled municipal records: 0",
      "",
      "School:",
      `${row.officialSchoolElections} official election records (no statewide school-district directory)`,
      "",
      "Official sources:",
      String(row.officialSources),
      "",
      "Compiled records:",
      String(row.compiledRecords)
    );
  }
  return lines.join("\n");
}

export function formatAuditDetail(rows: StateCoverageRow[]): string {
  const lines = ["STATE AUDIT", "==========="];
  for (const row of rows) {
    lines.push(
      "",
      row.stateCode,
      "------------",
      `Counties: ${row.countyCount}`,
      `Elections: ${row.electionCount}`,
      `Events: ${row.eventCount}`,
      `Official-source records: ${row.officialSourceRecords}`,
      `Compiled records: ${row.compiledRecords}`,
      `Missing source URLs: ${row.missingSourceUrls}`,
      `Missing source names: ${row.missingSourceNames}`,
      `Oldest lastVerified: ${row.oldestLastVerified || "none"}`,
      `Newest lastVerified: ${row.newestLastVerified || "none"}`,
      `Coverage: ${row.coverage}`,
      `Jurisdiction coverage: ${row.jurisdictionCoverage}`,
      `Federal/statewide election coverage: ${row.federalStatewideCoverage} (${row.countiesWithFecElections} / ${row.expectedCountyCount ?? row.countyCount})`,
      `Statewide calendar: ${row.localCalendarCoverage} (${ratio(row.countiesWithOfficialCalendar, row.expectedCountyCount)})`,
      `County-specific: ${row.countySpecificCoverage} (${ratio(row.countiesWithCountySpecific, row.expectedCountyCount)})`,
      `Municipal official elections: ${row.officialMunicipalElections}`,
      `School official elections: ${row.officialSchoolElections}`,
      `Official sources: ${row.officialSources}`,
      `Official calendar sources: ${row.officialCalendarSources}`
    );
  }
  return lines.join("\n");
}
