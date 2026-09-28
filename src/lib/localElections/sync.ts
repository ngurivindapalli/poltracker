import { getPrisma } from "@/lib/db";
import { recordDatasetFreshness } from "@/lib/sync/freshness";
import { countySlug } from "@/lib/localData/countySearch";
import { fetchCensusCounties } from "./adapters/censusCounties";
import { fetchFecStatewideElections } from "./adapters/fecStatewide";
import { compiledOverlayForState } from "./adapters/compiledOverlay";
import { coverageFromCounts } from "./coverage";
import { formatValidation, validateStateRecords } from "./validate";
import { upsertLocalRecords } from "./upsert";
import { enabledSources } from "./sources";
import { COMPILED_SOURCE_NAME } from "./types";
import type { CoverageStatus, NormalizedCounty, SyncOptions, StateSyncCounts } from "./types";

export type LocalElectionSyncReport = {
  states: number;
  counties: number;
  electionsFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  eventsFetched: number;
  sourceFailures: number;
  missingFields: number;
  durationMs: number;
  coverage: Record<string, CoverageStatus>;
  validation: string[];
  failures: string[];
  dryRun: boolean;
};

function addCounties(target: Map<string, NormalizedCounty>, rows: NormalizedCounty[]) {
  for (const row of rows) {
    const key = `${row.state}:${row.slug}`;
    const existing = target.get(key);
    if (!existing) {
      target.set(key, row);
      continue;
    }
    if (existing.sourceName === COMPILED_SOURCE_NAME && row.sourceName !== COMPILED_SOURCE_NAME) {
      target.set(key, row);
    }
  }
}

export async function syncLocalElections(
  options: SyncOptions = {}
): Promise<LocalElectionSyncReport> {
  const started = Date.now();
  const year = options.year || 2026;
  const sources = enabledSources({ states: options.states, force: options.force });
  const stateCodes = [...new Set(sources.map((s) => s.stateCode))];
  const failures: string[] = [];
  const validation: string[] = [];
  const coverage: Record<string, CoverageStatus> = {};
  const perState: StateSyncCounts[] = [];

  let counties = 0;
  let electionsFetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let eventsFetched = 0;
  let missingFields = 0;
  let sourceFailures = 0;

  await recordDatasetFreshness({
    dataset: "local_elections",
    status: "running",
    successful: false,
  });

  const census = await fetchCensusCounties(stateCodes);
  if (census.error) {
    sourceFailures += 1;
    failures.push(`census-counties: ${census.error}`);
  }

  for (const stateCode of stateCodes) {
    console.log(`Syncing ${stateCode}...`);
    const countyMap = new Map<string, NormalizedCounty>();
    addCounties(
      countyMap,
      census.counties.filter((c) => c.state === stateCode)
    );
    if (countyMap.size === 0) {
      addCounties(countyMap, await loadExistingCounties(stateCode));
    }
    const expectedCountyCount =
      census.counties.filter((c) => c.state === stateCode).length || null;
    if (options.county) {
      const only = countySlug(options.county);
      for (const key of [...countyMap.keys()]) {
        if (!key.endsWith(`:${only}`)) countyMap.delete(key);
      }
    }

    const countyNames = [...countyMap.values()].map((c) => c.countyName);
    const fec = await fetchFecStatewideElections(stateCode, countyNames, year);
    if (fec.error) {
      sourceFailures += 1;
      failures.push(`${stateCode} fec-statewide: ${fec.error}`);
    } else if (fec.emptyByDesign) {
      failures.push(
        `${stateCode} fec-statewide: source succeeded with zero election dates for ${year}`
      );
    }

    const compiled = compiledOverlayForState(stateCode, options.county);
    addCounties(countyMap, compiled.counties);

    const countiesToWrite = [...countyMap.values()];
    const elections = [...fec.elections, ...compiled.elections];
    const events = [...compiled.events];
    missingFields += fec.missingFields + compiled.missingFields;
    electionsFetched += elections.length;
    eventsFetched += events.length;

    const previous = await countStateElections(stateCode);
    if (
      !fec.error &&
      previous > 0 &&
      fec.elections.length > 0 &&
      fec.elections.length < previous * 0.4
    ) {
      failures.push(
        `${stateCode}: official election count dropped from ${previous} to ${fec.elections.length}; existing records were preserved`
      );
    }

    try {
      const result = await upsertLocalRecords({
        counties: countiesToWrite,
        elections,
        events,
        dryRun: options.dryRun,
      });
      counties += result.countiesProcessed;
      inserted += result.electionsInserted;
      updated += result.electionsUpdated;
      skipped += result.electionsSkipped;
      perState.push({
        stateCode,
        countiesProcessed: result.countiesProcessed,
        electionsFetched: elections.length,
        electionsInserted: result.electionsInserted,
        electionsUpdated: result.electionsUpdated,
        electionsSkipped: result.electionsSkipped,
        eventsFetched: events.length,
        eventsInserted: result.eventsInserted,
        eventsUpdated: result.eventsUpdated,
        missingFields: fec.missingFields + compiled.missingFields,
        sourceFailures: fec.error ? [fec.error] : [],
        coverage: "NONE",
      });
    } catch (err) {
      sourceFailures += 1;
      failures.push(
        `${stateCode} upsert: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const snapshot = await loadStateSnapshot(stateCode);
    const stateCoverage = coverageFromCounts({
      countyCount: snapshot.counties.length,
      expectedCountyCount,
      officialElectionCount: snapshot.elections.filter(
        (e) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME
      ).length,
      compiledElectionCount: snapshot.elections.filter(
        (e) => e.sourceName === COMPILED_SOURCE_NAME
      ).length,
      eventCount: snapshot.events.length,
      countiesWithOfficialElections: snapshot.countiesWithOfficialElections,
    });
    coverage[stateCode] = stateCoverage;
    const v = validateStateRecords({
      stateCode,
      counties: snapshot.counties,
      elections: snapshot.elections,
      events: snapshot.events,
      coverage: stateCoverage,
    });
    validation.push(formatValidation(v));
    await recordDatasetFreshness({
      dataset: `local_elections:${stateCode}`,
      status: fec.error ? "partial" : "success",
      recordCount: snapshot.elections.length,
      error: fec.error || null,
      successful: !fec.error,
    });
  }

  const durationMs = Date.now() - started;
  const status =
    sourceFailures === 0 ? "success" : stateCodes.length && sourceFailures < stateCodes.length + 1
      ? "partial"
      : "failed";
  await recordDatasetFreshness({
    dataset: "local_elections",
    status,
    recordCount: electionsFetched,
    error: failures[0] || null,
    successful: status !== "failed",
  });

  return {
    states: stateCodes.length,
    counties,
    electionsFetched,
    inserted,
    updated,
    skipped,
    eventsFetched,
    sourceFailures,
    missingFields,
    durationMs,
    coverage,
    validation,
    failures,
    dryRun: Boolean(options.dryRun),
  };
}

export function formatSyncReport(report: LocalElectionSyncReport): string {
  const lines = [
    "Local election sync",
    "-------------------",
    `States: ${report.states}`,
    `Counties: ${report.counties}`,
    `Elections fetched: ${report.electionsFetched}`,
    `Inserted: ${report.inserted}`,
    `Updated: ${report.updated}`,
    `Skipped: ${report.skipped}`,
    `Events fetched: ${report.eventsFetched}`,
    `Source failures: ${report.sourceFailures}`,
    `Records with missing fields: ${report.missingFields}`,
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
  ];
  if (report.dryRun) lines.push("Mode: dry-run (no database writes)");
  if (report.failures.length) {
    lines.push("", "Failures");
    for (const f of report.failures) lines.push(`- ${f}`);
  }
  if (Object.keys(report.coverage).length) {
    lines.push("", "Coverage");
    for (const [state, status] of Object.entries(report.coverage)) {
      lines.push(`${state}: ${status}`);
    }
  }
  if (report.validation.length) {
    lines.push("", "Validation");
    lines.push(report.validation.join("\n\n"));
  }
  return lines.join("\n");
}

async function loadExistingCounties(stateCode: string): Promise<NormalizedCounty[]> {
  const prisma = await getPrisma();
  if (!prisma?.localCounty) return [];
  try {
    const rows = await prisma.localCounty.findMany({ where: { state: stateCode } });
    return rows.map((row: any) => ({
      state: row.state,
      countyName: row.countyName,
      normalizedName: row.normalizedName,
      slug: row.slug,
      sourceName: row.sourceName,
      sourceUrl: row.sourceUrl,
      lastVerified: row.lastVerified,
    }));
  } catch {
    return [];
  }
}

async function countStateElections(stateCode: string): Promise<number> {
  const prisma = await getPrisma();
  if (!prisma?.localElection) return 0;
  try {
    return await prisma.localElection.count({
      where: { county: { state: stateCode } },
    });
  } catch {
    return 0;
  }
}

async function loadStateSnapshot(stateCode: string): Promise<{
  counties: Array<{ slug: string; state: string }>;
  elections: Array<{
    sourceKey?: string | null;
    sourceName?: string | null;
    sourceUrl?: string | null;
    electionDate?: Date | null;
    countySlug?: string;
  }>;
  events: Array<{ sourceKey?: string | null; sourceName?: string | null; sourceUrl?: string | null }>;
  countiesWithOfficialElections: number;
}> {
  const prisma = await getPrisma();
  if (!prisma?.localCounty) {
    return { counties: [], elections: [], events: [], countiesWithOfficialElections: 0 };
  }
  try {
    const rows = await prisma.localCounty.findMany({
      where: { state: stateCode },
      include: { elections: true, events: true },
    });
    const counties = rows.map((r: any) => ({ slug: r.slug, state: r.state }));
    const elections = rows.flatMap((r: any) =>
      (r.elections || []).map((e: any) => ({
        sourceKey: e.sourceKey,
        sourceName: e.sourceName,
        sourceUrl: e.sourceUrl,
        electionDate: e.electionDate,
        countySlug: r.slug,
      }))
    );
    const events = rows.flatMap((r: any) =>
      (r.events || []).map((e: any) => ({
        sourceKey: e.sourceKey,
        sourceName: e.sourceName,
        sourceUrl: e.sourceUrl,
      }))
    );
    const countiesWithOfficialElections = rows.filter((r: any) =>
      (r.elections || []).some(
        (e: any) => e.sourceName && e.sourceName !== COMPILED_SOURCE_NAME
      )
    ).length;
    return { counties, elections, events, countiesWithOfficialElections };
  } catch {
    return { counties: [], elections: [], events: [], countiesWithOfficialElections: 0 };
  }
}
