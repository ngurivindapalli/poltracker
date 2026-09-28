import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { COMPILED_SOURCE_NAME } from "./types";
import type { CoverageStatus } from "./types";

export type StateValidation = {
  stateCode: string;
  counties: number;
  elections: number;
  events: number;
  officialSourceRecords: number;
  compiledRecords: number;
  missingSourceUrls: number;
  missingSourceNames: number;
  duplicateCounties: number;
  duplicateElections: number;
  invalidDates: number;
  invalidStateCodes: number;
  coverage: CoverageStatus;
};

export function validateStateRecords(input: {
  stateCode: string;
  counties: Array<{ slug: string; state: string }>;
  elections: Array<{
    sourceKey?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    electionDate?: Date | string | null;
    countySlug?: string;
  }>;
  events: Array<{ sourceKey?: string | null; sourceName?: string | null; sourceUrl?: string | null }>;
  coverage: CoverageStatus;
}): StateValidation {
  const countySlugs = input.counties.map((c) => c.slug);
  const duplicateCounties = countySlugs.length - new Set(countySlugs).size;
  const electionKeys = input.elections.map(
    (e) => e.sourceKey || `${e.countySlug}|${String(e.electionDate)}`
  );
  const duplicateElections = electionKeys.length - new Set(electionKeys).size;
  const officialSourceRecords = input.elections.filter(
    (e) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME
  ).length;
  const compiledRecords = input.elections.filter(
    (e) => e.sourceName === COMPILED_SOURCE_NAME
  ).length;
  const missingSourceUrls = input.elections.filter(
    (e) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME && !e.sourceUrl
  ).length;
  const missingSourceNames = input.elections.filter((e) => !e.sourceName).length;
  const invalidDates = input.elections.filter((e) => {
    if (!e.electionDate) return false;
    const t = new Date(e.electionDate).getTime();
    return Number.isNaN(t);
  }).length;
  const invalidStateCodes = input.counties.filter(
    (c) => c.state !== input.stateCode || !STATE_CODE_TO_NAME[c.state]
  ).length;

  return {
    stateCode: input.stateCode,
    counties: input.counties.length,
    elections: input.elections.length,
    events: input.events.length,
    officialSourceRecords,
    compiledRecords,
    missingSourceUrls,
    missingSourceNames,
    duplicateCounties,
    duplicateElections,
    invalidDates,
    invalidStateCodes,
    coverage: input.coverage,
  };
}

export function formatValidation(v: StateValidation): string {
  return [
    v.stateCode,
    "------------",
    `Counties: ${v.counties}`,
    `Elections: ${v.elections}`,
    `Events: ${v.events}`,
    `Official source records: ${v.officialSourceRecords}`,
    `Compiled records: ${v.compiledRecords}`,
    `Missing source URLs: ${v.missingSourceUrls}`,
    `Missing source names: ${v.missingSourceNames}`,
    `Duplicate counties: ${v.duplicateCounties}`,
    `Duplicate elections: ${v.duplicateElections}`,
    `Coverage: ${v.coverage}`,
  ].join("\n");
}
