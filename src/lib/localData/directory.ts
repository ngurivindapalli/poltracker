import { getCountiesForState, STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";
import { getElectionsForCounty } from "@/lib/localData/elections";
import { getEventsForCounty } from "@/lib/localData/events";
import { countySlug, type CountyDirectoryRow } from "@/lib/localData/countySearch";
import { getPrisma } from "@/lib/db";
import { COMPILED_SOURCE_NAME } from "@/lib/localElections/types";
import type { CoverageStatus } from "@/lib/localElections/types";
import { coverageFromCounts } from "@/lib/localElections/coverage";
import { electionAuthorityForState } from "@/lib/localElections/sources";
import { isCompiledSource } from "@/lib/localElections/normalize";

export type { CountyDirectoryRow };

export type CountyDetail = {
  stateCode: string;
  stateName: string;
  name: string;
  slug: string;
  sourceName: string | null;
  sourceUrl: string | null;
  lastUpdated: string | null;
  coverage: CoverageStatus;
  authorityName: string | null;
  authorityUrl: string | null;
  elections: Array<{
    title: string;
    date: string | null;
    description: string | null;
    type: string | null;
    office: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    lastVerified: string | null;
  }>;
  events: Array<{
    title: string;
    date: string | null;
    description: string | null;
    location: string | null;
    sourceName: string | null;
    sourceUrl: string | null;
    lastVerified: string | null;
  }>;
};

function isUpcoming(date: string | null | undefined): boolean {
  if (!date) return true;
  const t = Date.parse(date);
  if (!Number.isFinite(t)) return true;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return t >= start.getTime();
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function latestOfficialVerified(values: Array<Date | string | null | undefined>): string | null {
  const stamps = values
    .map((v) => iso(v))
    .filter((v): v is string => Boolean(v))
    .sort();
  return stamps.pop() || null;
}

async function directoryFromDb(stateCode: string): Promise<{
  counties: CountyDirectoryRow[];
  coverage: CoverageStatus;
} | null> {
  const prisma = await getPrisma();
  if (!prisma?.localCounty) return null;
  try {
    const rows = await prisma.localCounty.findMany({
      where: { state: stateCode },
      include: {
        elections: true,
        events: true,
      },
      orderBy: { countyName: "asc" },
    });
    if (!rows.length) return null;
    const counties = rows.map((row: any) => {
      const upcoming = (row.elections || []).filter((e: any) =>
        isUpcoming(iso(e.electionDate))
      );
      const officialVerified = latestOfficialVerified([
        isCompiledSource(row.sourceName) ? null : row.lastVerified,
        ...(row.elections || [])
          .filter((e: any) => !isCompiledSource(e.sourceName))
          .map((e: any) => e.lastVerified),
      ]);
      return {
        name: row.countyName,
        slug: row.slug,
        upcomingElections: upcoming.length,
        localEvents: (row.events || []).length,
        lastUpdated: officialVerified,
        sourceName: row.sourceName || upcoming[0]?.sourceName || null,
      };
    });
    const coverage = coverageFromCounts({
      countyCount: rows.length,
      expectedCountyCount: rows.length,
      officialElectionCount: rows.reduce(
        (n: number, r: any) =>
          n +
          (r.elections || []).filter((e: any) => e.sourceName && !isCompiledSource(e.sourceName))
            .length,
        0
      ),
      compiledElectionCount: rows.reduce(
        (n: number, r: any) =>
          n + (r.elections || []).filter((e: any) => isCompiledSource(e.sourceName)).length,
        0
      ),
      eventCount: rows.reduce((n: number, r: any) => n + (r.events || []).length, 0),
      countiesWithOfficialElections: rows.filter((r: any) =>
        (r.elections || []).some((e: any) => e.sourceName && !isCompiledSource(e.sourceName))
      ).length,
    });
    return { counties, coverage };
  } catch {
    return null;
  }
}

export async function getCountyDirectory(stateCode: string): Promise<{
  stateName: string;
  counties: CountyDirectoryRow[];
  hasAnyRecords: boolean;
  source: "database" | "compiled";
  coverage: CoverageStatus;
  authorityName: string | null;
  authorityUrl: string | null;
}> {
  const code = stateCode.toUpperCase();
  const stateName = STATE_CODE_TO_NAME[code] || code;
  const authority = electionAuthorityForState(code);
  const fromDb = await directoryFromDb(code);
  if (fromDb) {
    return {
      stateName,
      counties: fromDb.counties,
      hasAnyRecords: fromDb.counties.some(
        (c) => c.upcomingElections > 0 || c.localEvents > 0
      ),
      source: "database",
      coverage: fromDb.coverage,
      authorityName: authority?.sourceName || null,
      authorityUrl: authority?.sourceUrl || null,
    };
  }

  const names = getCountiesForState(code);
  const counties = names.map((name) => {
    const elections = getElectionsForCounty(stateName, name).filter((e) =>
      isUpcoming(e.date)
    );
    const events = getEventsForCounty(stateName, name);
    return {
      name,
      slug: countySlug(name),
      upcomingElections: elections.length,
      localEvents: events.length,
      lastUpdated: null,
      sourceName: elections.length || events.length ? COMPILED_SOURCE_NAME : null,
    };
  });
  const hasAnyRecords = counties.some(
    (c) => c.upcomingElections > 0 || c.localEvents > 0
  );

  return {
    stateName,
    counties,
    hasAnyRecords,
    source: "compiled",
    coverage: coverageFromCounts({
      countyCount: counties.length,
      expectedCountyCount: names.length || null,
      officialElectionCount: 0,
      compiledElectionCount: counties.reduce((n, c) => n + c.upcomingElections, 0),
      eventCount: counties.reduce((n, c) => n + c.localEvents, 0),
      countiesWithOfficialElections: 0,
    }),
    authorityName: authority?.sourceName || null,
    authorityUrl: authority?.sourceUrl || null,
  };
}

export async function getCountyDetail(
  stateCode: string,
  slug: string
): Promise<CountyDetail | null> {
  const directory = await getCountyDirectory(stateCode);
  const row = directory.counties.find((c) => c.slug === slug);
  if (!row) return null;

  if (directory.source === "database") {
    const prisma = await getPrisma();
    const county = await prisma?.localCounty?.findUnique({
      where: { state_slug: { state: stateCode.toUpperCase(), slug } },
      include: { elections: true, events: true },
    });
    if (county) {
      return {
        stateCode: stateCode.toUpperCase(),
        stateName: directory.stateName,
        name: county.countyName,
        slug,
        sourceName: county.sourceName,
        sourceUrl: county.sourceUrl,
        lastUpdated: iso(county.lastVerified) || row.lastUpdated,
        coverage: directory.coverage,
        authorityName: directory.authorityName,
        authorityUrl: directory.authorityUrl,
        elections: (county.elections || []).map((e: any) => ({
          title: e.electionName,
          date: iso(e.electionDate),
          description: e.description,
          type: e.electionType,
          office: e.office,
          sourceName: e.sourceName,
          sourceUrl: e.sourceUrl,
          lastVerified: iso(e.lastVerified),
        })),
        events: (county.events || []).map((e: any) => ({
          title: e.title,
          date: iso(e.date),
          description: e.description,
          location: null,
          sourceName: e.sourceName,
          sourceUrl: e.sourceUrl,
          lastVerified: iso(e.lastVerified),
        })),
      };
    }
  }

  const elections = getElectionsForCounty(directory.stateName, row.name);
  const events = getEventsForCounty(directory.stateName, row.name);
  return {
    stateCode: stateCode.toUpperCase(),
    stateName: directory.stateName,
    name: row.name,
    slug,
    sourceName: row.sourceName,
    sourceUrl: null,
    lastUpdated: null,
    coverage: directory.coverage,
    authorityName: directory.authorityName,
    authorityUrl: directory.authorityUrl,
    elections: elections.map((e) => ({
      title: e.title,
      date: e.date,
      description: e.description,
      type: e.type || null,
      office: null,
      sourceName: COMPILED_SOURCE_NAME,
      sourceUrl: null,
      lastVerified: null,
    })),
    events: events.map((e) => ({
      title: e.title,
      date: e.date,
      description: e.description || null,
      location: e.location,
      sourceName: COMPILED_SOURCE_NAME,
      sourceUrl: null,
      lastVerified: null,
    })),
  };
}
