import { getPrisma } from "@/lib/db";
import type { NormalizedCounty, NormalizedElection, NormalizedEvent } from "./types";

export type UpsertCounts = {
  countiesProcessed: number;
  electionsInserted: number;
  electionsUpdated: number;
  electionsSkipped: number;
  eventsInserted: number;
  eventsUpdated: number;
};

function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

export async function upsertLocalRecords(input: {
  counties: NormalizedCounty[];
  elections: NormalizedElection[];
  events: NormalizedEvent[];
  dryRun?: boolean;
}): Promise<UpsertCounts> {
  const counts: UpsertCounts = {
    countiesProcessed: 0,
    electionsInserted: 0,
    electionsUpdated: 0,
    electionsSkipped: 0,
    eventsInserted: 0,
    eventsUpdated: 0,
  };
  if (input.dryRun) {
    counts.countiesProcessed = input.counties.length;
    counts.electionsInserted = input.elections.length;
    counts.eventsInserted = input.events.length;
    return counts;
  }

  const prisma = await getPrisma();
  if (!prisma?.localCounty) {
    throw new Error("PostgreSQL is not available (DATABASE_URL).");
  }

  const countyData = input.counties.map((county) => ({
    state: county.state,
    countyName: county.countyName,
    normalizedName: county.normalizedName,
    slug: county.slug,
    sourceName: county.sourceName,
    sourceUrl: county.sourceUrl,
    lastVerified: county.lastVerified,
  }));
  for (const part of chunk(countyData, 100)) {
    await prisma.localCounty.createMany({ data: part, skipDuplicates: true });
  }
  counts.countiesProcessed = input.counties.length;

  const states = [...new Set(input.counties.map((c) => c.state))];
  const countyRows = await prisma.localCounty.findMany({
    where: { state: { in: states } },
    select: { id: true, state: true, slug: true },
  });
  const countyIds = new Map<string, string>(
    countyRows.map((row: any) => [`${row.state}:${row.slug}`, row.id])
  );

  const electionData = [];
  for (const election of input.elections) {
    const countyId = countyIds.get(`${election.state}:${election.countySlug}`);
    if (!countyId || !election.sourceKey) {
      counts.electionsSkipped += 1;
      continue;
    }
    electionData.push({
      countyId,
      electionName: election.electionName,
      electionType: election.electionType,
      electionDate: election.electionDate,
      office: election.office,
      description: election.description,
      sourceUrl: election.sourceUrl,
      sourceName: election.sourceName,
      lastVerified: election.lastVerified,
      status: election.status,
      sourceKey: election.sourceKey,
    });
  }
  for (const part of chunk(electionData, 100)) {
    const created = await prisma.localElection.createMany({
      data: part,
      skipDuplicates: true,
    });
    counts.electionsInserted += created.count;
  }
  counts.electionsUpdated += Math.max(0, electionData.length - counts.electionsInserted);

  const eventData = [];
  for (const event of input.events) {
    const countyId = countyIds.get(`${event.state}:${event.countySlug}`);
    if (!countyId || !event.sourceKey) continue;
    eventData.push({
      countyId,
      title: event.title,
      date: event.date,
      description: event.description,
      sourceUrl: event.sourceUrl,
      sourceName: event.sourceName,
      lastVerified: event.lastVerified,
      sourceKey: event.sourceKey,
    });
  }
  for (const part of chunk(eventData, 100)) {
    const created = await prisma.localEvent.createMany({
      data: part,
      skipDuplicates: true,
    });
    counts.eventsInserted += created.count;
  }
  counts.eventsUpdated += Math.max(0, eventData.length - counts.eventsInserted);

  return counts;
}
