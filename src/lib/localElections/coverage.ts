import { COMPILED_SOURCE_NAME } from "./types";
import type { CoverageStatus } from "./types";

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

export function splitElectionSource(
  sourceName: string | null | undefined
): "compiled" | "official" | "unknown" {
  if (!sourceName) return "unknown";
  if (sourceName === COMPILED_SOURCE_NAME) return "compiled";
  return "official";
}
