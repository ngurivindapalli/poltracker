import { getPrisma } from "@/lib/db";
import type { NormalizedCandidate, NormalizedCounty, NormalizedElection, NormalizedEvent } from "./types";

export type UpsertCounts = {
  countiesProcessed: number;
  electionsInserted: number;
  electionsUpdated: number;
  electionsSkipped: number;
  eventsInserted: number;
  eventsUpdated: number;
  contestsInserted: number;
  contestsUpdated: number;
  candidatesInserted: number;
  candidatesUpdated: number;
};

function chunk<T>(rows: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < rows.length; i += size) out.push(rows.slice(i, i + size));
  return out;
}

function isContestRow(election: NormalizedElection): boolean {
  return election.recordKind === "CONTEST" || election.recordKind === "MEASURE";
}

export async function upsertLocalRecords(input: {
  counties: NormalizedCounty[];
  elections: NormalizedElection[];
  events: NormalizedEvent[];
  candidates?: NormalizedCandidate[];
  dryRun?: boolean;
}): Promise<UpsertCounts> {
  const contestCount = input.elections.filter(isContestRow).length;
  const counts: UpsertCounts = {
    countiesProcessed: 0,
    electionsInserted: 0,
    electionsUpdated: 0,
    electionsSkipped: 0,
    eventsInserted: 0,
    eventsUpdated: 0,
    contestsInserted: 0,
    contestsUpdated: 0,
    candidatesInserted: 0,
    candidatesUpdated: 0,
  };
  if (input.dryRun) {
    counts.countiesProcessed = input.counties.length;
    counts.electionsInserted = input.elections.length;
    counts.eventsInserted = input.events.length;
    counts.contestsInserted = contestCount;
    counts.candidatesInserted = (input.candidates || []).length;
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

  const states = [
    ...new Set([
      ...input.counties.map((c) => c.state),
      ...input.elections.map((e) => e.state),
      ...input.events.map((e) => e.state),
    ]),
  ].filter(Boolean);
  const countyRows = states.length
    ? await prisma.localCounty.findMany({
        where: { state: { in: states } },
        select: { id: true, state: true, slug: true },
      })
    : [];
  const countyIds = new Map<string, string>(
    countyRows.map((row: { id: string; state: string; slug: string }) => [`${row.state}:${row.slug}`, row.id])
  );

  const electionData = [];
  for (const election of input.elections) {
    const countyId = election.countySlug
      ? countyIds.get(`${election.state}:${election.countySlug}`) || null
      : null;
    if (election.countySlug && !countyId) {
      counts.electionsSkipped += 1;
      continue;
    }
    if (!election.sourceKey) {
      counts.electionsSkipped += 1;
      continue;
    }
    electionData.push({
      countyId,
      electionName: election.electionName,
      electionType: election.electionType,
      electionCategory: election.electionCategory,
      subtype: election.subtype,
      electionDate: election.electionDate,
      office: election.office,
      description: election.description,
      jurisdictionName: election.jurisdictionName,
      jurisdictionType: election.jurisdictionType,
      sourceUrl: election.sourceUrl,
      sourceName: election.sourceName,
      lastVerified: election.lastVerified,
      status: election.status,
      sourceKey: election.sourceKey,
      recordKind: election.recordKind || "ELECTION",
      state: election.state,
      district: election.district || null,
      chamber: election.chamber || null,
      externalId: election.externalId || null,
    });
  }
  const contestKeys = new Set(
    input.elections.filter(isContestRow).map((e) => e.sourceKey).filter(Boolean) as string[]
  );
  const contestData = electionData.filter((row) => contestKeys.has(row.sourceKey));
  const dateData = electionData.filter((row) => !contestKeys.has(row.sourceKey));
  for (const part of chunk(dateData, 100)) {
    const created = await prisma.localElection.createMany({
      data: part,
      skipDuplicates: true,
    });
    counts.electionsInserted += created.count;
  }
  for (const part of chunk(contestData, 100)) {
    const created = await prisma.localElection.createMany({
      data: part,
      skipDuplicates: true,
    });
    counts.electionsInserted += created.count;
    counts.contestsInserted += created.count;
  }
  counts.electionsUpdated += Math.max(0, electionData.length - counts.electionsInserted);
  counts.contestsUpdated += Math.max(0, contestData.length - counts.contestsInserted);

  const existingElectionKeys = electionData
    .map((row) => row.sourceKey)
    .filter((key): key is string => Boolean(key));
  for (const part of chunk(existingElectionKeys, 100)) {
    const verified = input.elections.find((e) => part.includes(e.sourceKey))?.lastVerified;
    if (!verified) continue;
    await prisma.localElection.updateMany({
      where: { sourceKey: { in: part } },
      data: { lastVerified: verified },
    });
  }

  const eventData = [];
  for (const event of input.events) {
    const countyId = event.countySlug
      ? countyIds.get(`${event.state}:${event.countySlug}`)
      : null;
    if (!countyId || !event.sourceKey) continue;
    eventData.push({
      countyId,
      title: event.title,
      eventType: event.eventType,
      date: event.date,
      endDate: event.endDate,
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
  const existingEventKeys = eventData
    .map((row) => row.sourceKey)
    .filter((key): key is string => Boolean(key));
  for (const part of chunk(existingEventKeys, 100)) {
    const verified = input.events.find((e) => part.includes(e.sourceKey))?.lastVerified;
    if (!verified) continue;
    await prisma.localEvent.updateMany({
      where: { sourceKey: { in: part } },
      data: { lastVerified: verified },
    });
  }

  const candidates = input.candidates || [];
  if (candidates.length && prisma.localCandidate) {
    const electionKeys = [...new Set(candidates.map((c) => c.electionSourceKey))];
    const electionRows = await prisma.localElection.findMany({
      where: { sourceKey: { in: electionKeys } },
      select: { id: true, sourceKey: true },
    });
    const electionIds = new Map<string, string>(
      electionRows.map((row: { id: string; sourceKey: string | null }) => [row.sourceKey || "", row.id])
    );
    const candidateData = [];
    for (const candidate of candidates) {
      const electionId = electionIds.get(candidate.electionSourceKey);
      if (!electionId || !candidate.sourceKey || !candidate.candidateName) continue;
      candidateData.push({
        electionId,
        candidateName: candidate.candidateName,
        candidateId: candidate.candidateId,
        office: candidate.office,
        state: candidate.state,
        district: candidate.district,
        party: candidate.party,
        electionYears: candidate.electionYears,
        candidateStatus: candidate.candidateStatus,
        incumbent: candidate.incumbent,
        sourceUrl: candidate.sourceUrl,
        sourceName: candidate.sourceName,
        lastVerified: candidate.lastVerified,
        sourceKey: candidate.sourceKey,
      });
    }
    for (const part of chunk(candidateData, 100)) {
      const created = await prisma.localCandidate.createMany({
        data: part,
        skipDuplicates: true,
      });
      counts.candidatesInserted += created.count;
    }
    counts.candidatesUpdated += Math.max(0, candidateData.length - counts.candidatesInserted);
    const existingCandidateKeys = candidateData
      .map((row) => row.sourceKey)
      .filter((key): key is string => Boolean(key));
    for (const part of chunk(existingCandidateKeys, 100)) {
      const verified = candidates.find((c) => part.includes(c.sourceKey))?.lastVerified;
      if (!verified) continue;
      await prisma.localCandidate.updateMany({
        where: { sourceKey: { in: part } },
        data: { lastVerified: verified },
      });
    }
  }

  return counts;
}
