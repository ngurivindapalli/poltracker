import { COMPILED_SOURCE_NAME } from "./types";
import type { CoverageStatus, LayerCoverage } from "./types";

export type CoverageInput = {
  countyCount: number;
  expectedCountyCount: number | null;
  officialElectionCount: number;
  compiledElectionCount: number;
  eventCount: number;
  countiesWithOfficialElections: number;
};

export function coverageFromCounts(input: CoverageInput): CoverageStatus {
  const hasAny =
    input.countyCount > 0 ||
    input.officialElectionCount > 0 ||
    input.compiledElectionCount > 0 ||
    input.eventCount > 0;
  if (!hasAny) return "NONE";

  const directoryComplete =
    input.expectedCountyCount != null &&
    input.expectedCountyCount > 0 &&
    input.countyCount === input.expectedCountyCount;
  const officialCoversDirectory =
    directoryComplete &&
    input.countiesWithOfficialElections === input.countyCount &&
    input.officialElectionCount > 0;

  if (officialCoversDirectory) return "FULL";
  return "PARTIAL";
}

export type LayerCoverageInput = {
  countyCount: number;
  expectedCountyCount: number | null;
  countiesWithFecElections: number;
  countiesWithOfficialCalendar: number;
  countiesWithCountySpecificCalendars?: number;
  countiesWithMunicipalElections: number;
  countiesWithSchoolElections?: number;
};

function directoryLayer(
  count: number,
  countyCount: number,
  directoryComplete: boolean,
  partialLabel: LayerCoverage
): LayerCoverage {
  if (!count) return "NONE";
  if (directoryComplete && count === countyCount) return "COMPLETE";
  return partialLabel;
}

export function layerCoverageFromCounts(input: LayerCoverageInput): {
  jurisdictionCoverage: LayerCoverage;
  federalStatewideCoverage: LayerCoverage;
  localCalendarCoverage: LayerCoverage;
  countySpecificCoverage: LayerCoverage;
  municipalCalendarCoverage: LayerCoverage;
  schoolCalendarCoverage: LayerCoverage;
} {
  const expected = input.expectedCountyCount;
  const directoryComplete =
    expected != null && expected > 0 && input.countyCount === expected;
  const jurisdictionCoverage: LayerCoverage = !input.countyCount
    ? "NONE"
    : directoryComplete
      ? "COMPLETE"
      : "PARTIAL";

  return {
    jurisdictionCoverage,
    federalStatewideCoverage: directoryLayer(
      input.countiesWithFecElections,
      input.countyCount,
      directoryComplete,
      "PARTIAL"
    ),
    localCalendarCoverage: directoryLayer(
      input.countiesWithOfficialCalendar,
      input.countyCount,
      directoryComplete,
      "PARTIAL"
    ),
    countySpecificCoverage: directoryLayer(
      input.countiesWithCountySpecificCalendars || 0,
      input.countyCount,
      directoryComplete,
      "PARTIAL"
    ),
    municipalCalendarCoverage: directoryLayer(
      input.countiesWithMunicipalElections,
      input.countyCount,
      directoryComplete,
      "LIMITED"
    ),
    schoolCalendarCoverage: directoryLayer(
      input.countiesWithSchoolElections || 0,
      input.countyCount,
      directoryComplete,
      "LIMITED"
    ),
  };
}

export function splitElectionSource(
  sourceName: string | null | undefined
): "compiled" | "official" | "unknown" {
  if (!sourceName) return "unknown";
  if (sourceName === COMPILED_SOURCE_NAME) return "compiled";
  return "official";
}
