import { getPrisma } from "@/lib/db";
import { recordDatasetFreshness } from "@/lib/sync/freshness";
import { countySlug } from "@/lib/localData/countySearch";
import { fetchCensusCounties } from "./adapters/censusCounties";
import { fetchFecStatewideElections } from "./adapters/fecStatewide";
import { fetchFecContests } from "./adapters/fecContests";
import { fetchStateContests, STATE_CONTEST_STATES } from "./adapters/stateContests";
import { fetchOfficialCalendar } from "./adapters/officialCalendar";
import { compiledOverlayForState } from "./adapters/compiledOverlay";
import { coverageFromCounts } from "./coverage";
import { formatValidation, validateStateRecords } from "./validate";
import { formatContestValidation, validateContestRecords } from "./validateContests";
import { upsertLocalRecords } from "./upsert";
import { enabledSources } from "./sources";
import { enabledCalendarSources } from "./calendarSources";
import { COMPILED_SOURCE_NAME } from "./types";
import type { CoverageStatus, NormalizedCandidate, NormalizedCounty, NormalizedElection, NormalizedEvent, SyncOptions, StateSyncCounts } from "./types";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export type LocalElectionSyncReport = {
  states: number;
  counties: number;
  sources: number;
  jurisdictions: number;
  electionsFetched: number;
  inserted: number;
  updated: number;
  skipped: number;
  eventsFetched: number;
  eventsInserted: number;
  eventsUpdated: number;
  contestsFetched: number;
  contestsInserted: number;
  contestsUpdated: number;
  candidatesFetched: number;
  candidatesInserted: number;
  candidatesUpdated: number;
  sourceFailures: number;
  missingFields: number;
  durationMs: number;
  coverage: Record<string, CoverageStatus>;
  validation: string[];
  failures: string[];
  warnings: string[];
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
  const sourceLayer = options.source || "all";
  const level = options.level;
  const includeContests = options.includeContests !== false;
  const runFoundation = sourceLayer !== "official" && (!level || level === "federal");
  const runCalendar = sourceLayer !== "fec" && (!level || level === "state" || level === "county");
  const runCompiled = runFoundation && !level;
  const runFederalContests = includeContests && runFoundation;
  const runStateContests =
    includeContests &&
    sourceLayer !== "fec" &&
    (!level || level === "state");
  const foundationSources = runFoundation
    ? enabledSources({
        states: options.states,
        force: options.force,
        batch: options.batch,
      })
    : [];
  const calendarSources = runCalendar
    ? enabledCalendarSources({
        states: options.states,
        force: options.force,
        level,
      })
    : [];
  const stateCodes = [
    ...new Set([
      ...foundationSources.map((s) => s.stateCode),
      ...calendarSources.map((s) => s.stateCode),
    ]),
  ];
  const failures: string[] = [];
  const warnings: string[] = [];
  const validation: string[] = [];
  const coverage: Record<string, CoverageStatus> = {};
  const perState: StateSyncCounts[] = [];

  let counties = 0;
  let electionsFetched = 0;
  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let eventsFetched = 0;
  let eventsInserted = 0;
  let eventsUpdated = 0;
  let contestsFetched = 0;
  let contestsInserted = 0;
  let contestsUpdated = 0;
  let candidatesFetched = 0;
  let candidatesInserted = 0;
  let candidatesUpdated = 0;
  let missingFields = 0;
  let sourceFailures = 0;
  let sourcesRun = calendarSources.length + (runFoundation ? foundationSources.length : 0);

  await recordDatasetFreshness({
    dataset: "local_elections",
    status: "running",
    successful: false,
  });

  const census = runFoundation
    ? await fetchCensusCounties(stateCodes)
    : { counties: [] as NormalizedCounty[], error: undefined as string | undefined };
  if (census.error) {
    sourceFailures += 1;
    failures.push(`census-counties: ${census.error}`);
  }

  async function upsertContestBatch(
    label: string,
    contests: NormalizedElection[],
    candidates: NormalizedCandidate[]
  ) {
    contestsFetched += contests.length;
    candidatesFetched += candidates.length;
    const issues = validateContestRecords({ contests, candidates });
    validation.push(...formatContestValidation(issues));
    if (!contests.length && !candidates.length) return;
    try {
      const result = await upsertLocalRecords({
        counties: [],
        elections: contests,
        events: [],
        candidates,
        dryRun: options.dryRun,
      });
      inserted += result.electionsInserted;
      updated += result.electionsUpdated;
      skipped += result.electionsSkipped;
      contestsInserted += result.contestsInserted;
      contestsUpdated += result.contestsUpdated;
      candidatesInserted += result.candidatesInserted;
      candidatesUpdated += result.candidatesUpdated;
      electionsFetched += contests.length;
    } catch (err) {
      sourceFailures += 1;
      failures.push(`${label} upsert: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  if (runFederalContests) {
    console.log("Fetching FEC contests...");
    sourcesRun += 1;
    const fecContests = await fetchFecContests(year);
    if (fecContests.error) {
      sourceFailures += 1;
      failures.push(`fec-contests: ${fecContests.error}`);
      warnings.push("Failed FEC contest sync preserved existing contest data.");
    } else {
      missingFields += fecContests.missingFields;
      const wanted = (options.states || []).map((s) => s.toUpperCase());
      const contests = wanted.length
        ? fecContests.contests.filter((c) => c.state === "US" || wanted.includes(c.state))
        : fecContests.contests;
      const contestKeys = new Set(contests.map((c) => c.sourceKey));
      const candidates = fecContests.candidates.filter((c) => contestKeys.has(c.electionSourceKey));
      if (!contests.length) {
        warnings.push(
          `fec-contests: source succeeded with zero contest records for ${year}; existing records were preserved`
        );
      } else {
        console.log(
          `FEC contests: ${contests.length} proposed, candidates: ${candidates.length}`
        );
        await upsertContestBatch("fec-contests", contests, candidates);
      }
    }
  }

  if (runStateContests) {
    console.log("Fetching state contests...");
    const stateWanted = (options.states || [...STATE_CONTEST_STATES]).map((s) => s.toUpperCase());
    sourcesRun += stateWanted.filter((s) => STATE_CONTEST_STATES.includes(s as (typeof STATE_CONTEST_STATES)[number])).length;
    const stateResult = await fetchStateContests({ states: stateWanted, year });
    sourceFailures += stateResult.failures.length;
    failures.push(...stateResult.failures);
    for (const empty of stateResult.emptySources) {
      warnings.push(`${empty}: official source returned no named contests; existing records were preserved`);
    }
    if (stateResult.contests.length) {
      console.log(
        `State contests: ${stateResult.contests.length} proposed, candidates: ${stateResult.candidates.length}`
      );
      await upsertContestBatch("state-contests", stateResult.contests, stateResult.candidates);
    }
  }

  for (let i = 0; i < stateCodes.length; i++) {
    const stateCode = stateCodes[i];
    if (i > 0) await sleep(300);
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
      census.counties.filter((c) => c.state === stateCode).length ||
      countyMap.size ||
      null;
    if (options.county) {
      const only = countySlug(options.county);
      for (const key of [...countyMap.keys()]) {
        if (!key.endsWith(`:${only}`)) countyMap.delete(key);
      }
    }

    const countyNames = [...countyMap.values()].map((c) => c.countyName);
    const countySlugs = [...countyMap.values()].map((c) => c.slug);
    let elections: NormalizedElection[] = [];
    let events: NormalizedEvent[] = [];

    if (runFoundation) {
      const fec = await fetchFecStatewideElections(stateCode, countyNames, year);
      if (fec.error) {
        sourceFailures += 1;
        failures.push(`${stateCode} fec-statewide: ${fec.error}`);
      } else if (fec.emptyByDesign) {
        warnings.push(
          `${stateCode} fec-statewide: source succeeded with zero election dates for ${year}`
        );
      }
      const compiled = runCompiled
        ? compiledOverlayForState(stateCode, options.county)
        : { counties: [], elections: [], events: [], missingFields: 0 };
      addCounties(countyMap, compiled.counties);
      elections = [...fec.elections, ...compiled.elections];
      events = [...compiled.events];
      missingFields += fec.missingFields + compiled.missingFields;

      const previous = await countStateElections(stateCode);
      if (
        !fec.error &&
        previous > 0 &&
        fec.elections.length > 0 &&
        fec.elections.length < previous * 0.4
      ) {
        warnings.push(
          `${stateCode}: official election count dropped from ${previous} to ${fec.elections.length}; existing records were preserved`
        );
      }
    }

    if (runCalendar) {
      const stateCalendars = calendarSources.filter((s) => s.stateCode === stateCode);
      const previousEvents = await countStateEvents(stateCode);
      for (const calendar of stateCalendars) {
        if (calendar.countySlug) await sleep(300);
        const result = await fetchOfficialCalendar(calendar, countySlugs, year);
        if (result.error) {
          sourceFailures += 1;
          failures.push(`${stateCode} ${calendar.parser}: ${result.error}`);
          continue;
        }
        if (result.emptyByDesign) {
          warnings.push(
            `${stateCode} ${calendar.parser}: official calendar returned zero dated rows; existing records were preserved`
          );
          continue;
        }
        if (
          !calendar.countySlug &&
          previousEvents > 0 &&
          result.events.length > 0 &&
          result.events.length < previousEvents * 0.4
        ) {
          warnings.push(
            `${stateCode} ${calendar.parser}: calendar row count dropped; existing records were preserved and new rows were still stored`
          );
        }
        events = [...events, ...result.events];
        elections = [...elections, ...result.elections];
      }
    }

    const countiesToWrite = [...countyMap.values()];
    electionsFetched += elections.length;
    eventsFetched += events.length;

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
      eventsInserted += result.eventsInserted;
      eventsUpdated += result.eventsUpdated;
      contestsInserted += result.contestsInserted;
      contestsUpdated += result.contestsUpdated;
      const countyContests = elections.filter(
        (e) => e.recordKind === "CONTEST" || e.recordKind === "MEASURE"
      ).length;
      contestsFetched += countyContests;
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
        missingFields,
        sourceFailures: [],
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
      status: sourceFailures > 0 ? "partial" : "success",
      recordCount: snapshot.elections.length,
      error: failures.find((f) => f.startsWith(stateCode)) || null,
      successful: !failures.some((f) => f.startsWith(stateCode)),
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
    sources: sourcesRun,
    jurisdictions: counties,
    electionsFetched,
    inserted,
    updated,
    skipped,
    eventsFetched,
    eventsInserted,
    eventsUpdated,
    contestsFetched,
    contestsInserted,
    contestsUpdated,
    candidatesFetched,
    candidatesInserted,
    candidatesUpdated,
    sourceFailures,
    missingFields,
    durationMs,
    coverage,
    validation,
    failures,
    warnings,
    dryRun: Boolean(options.dryRun),
  };
}

export function formatSyncReport(report: LocalElectionSyncReport): string {
  const lines = [
    "Local election calendar sync",
    "----------------------------",
    `States: ${report.states}`,
    `Sources: ${report.sources}`,
    `Jurisdictions: ${report.jurisdictions}`,
    `Elections fetched: ${report.electionsFetched}`,
    `Inserted: ${report.inserted}`,
    `Updated: ${report.updated}`,
    `Skipped: ${report.skipped}`,
    `Events fetched: ${report.eventsFetched}`,
    `Events inserted: ${report.eventsInserted}`,
    `Events updated: ${report.eventsUpdated}`,
    `Contests fetched: ${report.contestsFetched}`,
    `Contests inserted: ${report.contestsInserted}`,
    `Contests updated: ${report.contestsUpdated}`,
    `Candidates fetched: ${report.candidatesFetched}`,
    `Candidates inserted: ${report.candidatesInserted}`,
    `Candidates updated: ${report.candidatesUpdated}`,
    `Failures: ${report.sourceFailures}`,
    `Warnings: ${report.warnings.length}`,
    `Duration: ${(report.durationMs / 1000).toFixed(1)}s`,
  ];
  if (report.dryRun) lines.push("Mode: dry-run (no database writes)");
  if (report.failures.length) {
    lines.push("", "Failures");
    for (const f of report.failures) lines.push(`- ${f}`);
  }
  if (report.warnings.length) {
    lines.push("", "Warnings");
    for (const w of report.warnings) lines.push(`- ${w}`);
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

async function countStateEvents(stateCode: string): Promise<number> {
  const prisma = await getPrisma();
  if (!prisma?.localEvent) return 0;
  try {
    return await prisma.localEvent.count({
      where: { county: { state: stateCode } },
    });
  } catch {
    return 0;
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
