import { getPrisma } from "@/lib/db";
import { getDatasetFreshness } from "@/lib/sync/freshness";
import { buildBillLink } from "@/lib/bills/linkBuilder";

export type StoredBill = {
  number: string;
  type: string;
  congress: number | null;
  title: string;
  latestAction: string | null;
  congressUrl?: string | null;
};

export type MemberLegislationPayload = {
  sponsored: StoredBill[];
  cosponsored: StoredBill[];
  status: "ok" | "empty" | "unsynced";
  lastUpdated: string | null;
};

function toBill(row: any): StoredBill {
  return {
    number: String(row.billNumber),
    type: String(row.billType),
    congress: row.congress || null,
    title: row.title,
    latestAction: row.latestAction || null,
    congressUrl:
      row.congressUrl ||
      buildBillLink({
        congress: row.congress || "",
        type: row.billType,
        number: row.billNumber,
      }) ||
      null,
  };
}

export async function getMemberLegislation(
  bioguideId: string
): Promise<MemberLegislationPayload> {
  const bid = bioguideId.toUpperCase();
  const freshness = await getDatasetFreshness("legislation");
  const prisma = await getPrisma();

  if (!prisma?.memberBill) {
    return {
      sponsored: [],
      cosponsored: [],
      status: freshness?.lastSuccessfulSync ? "empty" : "unsynced",
      lastUpdated: freshness?.lastSuccessfulSync ?? null,
    };
  }

  try {
    const rows = await prisma.memberBill.findMany({
      where: { bioguideId: bid },
      orderBy: [{ congress: "desc" }, { billNumber: "desc" }],
    });

    const sponsored = rows.filter((r: any) => r.role === "sponsored").map(toBill);
    const cosponsored = rows
      .filter((r: any) => r.role === "cosponsored")
      .map(toBill);

    let lastUpdated = freshness?.lastSuccessfulSync ?? null;
    if (rows.length > 0) {
      const newest = rows.reduce((a: Date, r: any) => {
        const d = r.fetchedAt instanceof Date ? r.fetchedAt : new Date(r.fetchedAt);
        return d > a ? d : a;
      }, new Date(0));
      if (newest.getTime() > 0) lastUpdated = newest.toISOString();
    }

    if (sponsored.length === 0 && cosponsored.length === 0) {
      return {
        sponsored: [],
        cosponsored: [],
        status: lastUpdated ? "empty" : "unsynced",
        lastUpdated,
      };
    }

    return {
      sponsored,
      cosponsored,
      status: "ok",
      lastUpdated,
    };
  } catch (e) {
    console.info(
      `Congress legislation DB read: member=${bid} error=${
        e instanceof Error ? e.message : "error"
      }`
    );
    return {
      sponsored: [],
      cosponsored: [],
      status: freshness?.lastSuccessfulSync ? "empty" : "unsynced",
      lastUpdated: freshness?.lastSuccessfulSync ?? null,
    };
  }
}

export async function getRecentLegislationFromDb(limit = 10) {
  const prisma = await getPrisma();
  const freshness = await getDatasetFreshness("legislation_recent");
  if (!prisma?.recentLegislationCache) {
    return {
      bills: [] as any[],
      fetchedAt: freshness?.lastSuccessfulSync || new Date().toISOString(),
      status: freshness?.lastSuccessfulSync ? "empty" : ("unavailable" as const),
    };
  }

  try {
    const row = await prisma.recentLegislationCache.findUnique({
      where: { id: "latest" },
    });
    if (!row?.billsJson) {
      return {
        bills: [],
        fetchedAt: freshness?.lastSuccessfulSync || new Date().toISOString(),
        status: freshness?.lastSuccessfulSync ? "empty" : "unavailable",
      };
    }
    const bills = JSON.parse(row.billsJson);
    const list = Array.isArray(bills) ? bills.slice(0, limit) : [];
    return {
      bills: list,
      fetchedAt: row.fetchedAt.toISOString(),
      status: list.length ? "ok" : "empty",
    };
  } catch {
    return {
      bills: [],
      fetchedAt: freshness?.lastSuccessfulSync || new Date().toISOString(),
      status: freshness?.lastSuccessfulSync ? "empty" : "unavailable",
    };
  }
}

export async function getBillsForMembers(
  bioguideIds: string[],
  take = 40
): Promise<{ sponsored: StoredBill[]; cosponsored: StoredBill[] }> {
  const ids = bioguideIds.map((id) => id.toUpperCase()).filter(Boolean);
  const prisma = await getPrisma();
  if (!prisma?.memberBill || ids.length === 0) {
    return { sponsored: [], cosponsored: [] };
  }
  try {
    const rows = await prisma.memberBill.findMany({
      where: { bioguideId: { in: ids } },
      orderBy: { fetchedAt: "desc" },
      take,
    });
    return {
      sponsored: rows.filter((r: any) => r.role === "sponsored").map(toBill),
      cosponsored: rows.filter((r: any) => r.role === "cosponsored").map(toBill),
    };
  } catch {
    return { sponsored: [], cosponsored: [] };
  }
}
