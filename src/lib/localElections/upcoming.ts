import { getPrisma } from "@/lib/db";
import { COMPILED_SOURCE_NAME, FEC_SOURCE_NAME } from "./types";

export type UpcomingLocalElection = {
  stateCode: string;
  countySlug: string;
  countyName: string;
  title: string;
  date: string;
  electionType: string | null;
  electionCategory: string | null;
  office: string | null;
  jurisdictionName: string | null;
  sourceName: string | null;
  sourceUrl: string | null;
  lastVerified: string | null;
  href: string;
  statewide: boolean;
  recordKind: string | null;
  candidates: Array<{
    name: string;
    party: string | null;
    status: string | null;
    incumbent: string | null;
    candidateId: string | null;
  }>;
};

const OUT_OF_SCOPE = new Set(["MUNICIPAL", "TOWN", "TOWNSHIP", "SCHOOL"]);

function startOfTodayUtc(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0));
}

function rowState(row: { state?: string | null; county?: { state?: string | null } | null }): string {
  return (row.state || row.county?.state || "").toUpperCase();
}

function toUpcoming(row: any, state: string | undefined): UpcomingLocalElection | null {
  if (!row.electionDate) return null;
  if (row.sourceName === COMPILED_SOURCE_NAME) return null;
  if (row.electionCategory && OUT_OF_SCOPE.has(row.electionCategory)) return null;
  if (row.sourceName && row.sourceName !== COMPILED_SOURCE_NAME && !row.lastVerified) return null;
  const code = rowState(row);
  if (state && code !== state && code !== "US") return null;
  const date = new Date(row.electionDate).toISOString().slice(0, 10);
  return {
    stateCode: code || state || "",
    countySlug: row.county?.slug || "",
    countyName: row.county?.countyName || row.jurisdictionName || code,
    title: row.electionName,
    date,
    electionType: row.electionType,
    electionCategory: row.electionCategory,
    office: row.office,
    jurisdictionName: row.jurisdictionName,
    sourceName: row.sourceName,
    sourceUrl: row.sourceUrl,
    lastVerified: row.lastVerified ? new Date(row.lastVerified).toISOString() : null,
    href: row.county?.slug
      ? `/state/${code}/local/${row.county.slug}`
      : `/state/${code || state}/local`,
    statewide: !row.countyId || row.sourceName === FEC_SOURCE_NAME || code === "US",
    recordKind: row.recordKind || "ELECTION",
    candidates: (row.candidates || []).map((c: any) => ({
      name: c.candidateName,
      party: c.party,
      status: c.candidateStatus,
      incumbent: c.incumbent,
      candidateId: c.candidateId,
    })),
  };
}

export async function getUpcomingLocalElections(options?: {
  state?: string;
  limit?: number;
  jurisdictionType?: string;
}): Promise<UpcomingLocalElection[]> {
  const prisma = await getPrisma();
  if (!prisma?.localElection) return [];
  const limit = Math.max(1, Math.min(options?.limit || 25, 100));
  const state = options?.state?.toUpperCase();
  const dateFilter = { gte: startOfTodayUtc() };
  const stateFilter = state
    ? {
        OR: [{ state }, { state: "US" }],
      }
    : {};
  try {
    const contestRows = await prisma.localElection.findMany({
      where: {
        electionDate: dateFilter,
        recordKind: { in: ["CONTEST", "MEASURE"] },
        ...stateFilter,
        ...(options?.jurisdictionType ? { jurisdictionType: options.jurisdictionType } : {}),
      },
      include: {
        county: { select: { state: true, slug: true, countyName: true } },
        candidates: true,
      },
      orderBy: [{ electionDate: "asc" }, { electionName: "asc" }],
      take: Math.min(limit * 4, 200),
    });
    const grouped = new Map<string, UpcomingLocalElection>();
    for (const row of contestRows) {
      const item = toUpcoming(row, state);
      if (!item) continue;
      const key = `${item.stateCode}|${item.date}|${item.title}|${item.sourceName || ""}|${item.recordKind || ""}`;
      if (!grouped.has(key)) grouped.set(key, item);
    }
    if (!grouped.size) {
      const electionRows = await prisma.localElection.findMany({
        where: {
          electionDate: dateFilter,
          OR: [{ recordKind: "ELECTION" }, { recordKind: null }],
          ...(state
            ? { OR: [{ state }, { county: { state } }] }
            : {}),
          ...(options?.jurisdictionType ? { jurisdictionType: options.jurisdictionType } : {}),
        },
        include: {
          county: { select: { state: true, slug: true, countyName: true } },
        },
        orderBy: [{ electionDate: "asc" }, { electionName: "asc" }],
        take: Math.min(limit * 8, 80),
      });
      for (const row of electionRows) {
        const item = toUpcoming(row, state);
        if (!item) continue;
        const key = `${item.stateCode}|${item.date}|${item.title}|${item.sourceName || ""}|ELECTION`;
        if (!grouped.has(key)) grouped.set(key, item);
      }
    }
    return [...grouped.values()]
      .map((item) => ({
        ...item,
        href: item.statewide ? `/state/${item.stateCode}/local` : item.href,
      }))
      .sort(
        (a, b) =>
          a.date.localeCompare(b.date) ||
          (a.electionType || "").localeCompare(b.electionType || "") ||
          a.title.localeCompare(b.title)
      )
      .slice(0, limit);
  } catch (err) {
    console.error("[localElections] upcoming query failed:", err instanceof Error ? err.message : err);
    return [];
  }
}
