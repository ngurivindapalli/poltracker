/**
 * Background Congress.gov → PostgreSQL sync.
 * Never invoked from a user-facing page render.
 */
import fs from "fs";
import path from "path";
import {
  fetchCosponsoredLegislation,
  fetchRecentBills,
  fetchSponsoredLegislation,
} from "@/lib/congress";
import { getPrisma } from "@/lib/db";
import { recordDatasetFreshness } from "@/lib/sync/freshness";
import { buildBillLink } from "@/lib/bills/linkBuilder";
import type { RecentLegislationBill } from "@/lib/legislation/recent";

type RosterMember = {
  name?: string;
  bioguide_id?: string;
  bioguideId?: string;
  role?: string;
};

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function loadRoster(chamber?: "senate" | "house"): RosterMember[] {
  const p = path.join(process.cwd(), "data", "poltracker_congress_dataset.json");
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as RosterMember[];
  return raw.filter((m) => {
    const id = (m.bioguide_id || m.bioguideId || "").toUpperCase();
    if (!id) return false;
    if (!chamber) return true;
    if (chamber === "senate") return m.role === "Senator";
    return m.role === "Representative";
  });
}

function extractBills(data: unknown, primaryKey: string) {
  if (!data || typeof data !== "object") return [];
  const record = data as Record<string, any>;
  const candidates = [
    record[primaryKey],
    record[primaryKey]?.item,
    record.bills,
    record.bills?.item,
  ];
  for (const value of candidates) {
    if (Array.isArray(value)) return value;
  }
  return [];
}

function normalizeBill(raw: any, role: "sponsored" | "cosponsored") {
  const number = String(raw?.number ?? raw?.billNumber ?? "").trim();
  const type = String(raw?.type ?? raw?.billType ?? "").trim();
  if (!number || !type) return null;
  const congressRaw = raw?.congress;
  const congress =
    typeof congressRaw === "number"
      ? congressRaw
      : Number(congressRaw) || 0;
  const title =
    raw?.titles?.[0]?.title ||
    raw?.title ||
    `${type.toUpperCase()} ${number}`;
  const latestAction = raw?.latestAction?.text || null;
  return {
    role,
    congress,
    billType: type,
    billNumber: number,
    title,
    latestAction,
    congressUrl:
      buildBillLink({ congress, type, number }) || null,
  };
}

async function replaceMemberRole(
  prisma: any,
  bioguideId: string,
  role: "sponsored" | "cosponsored",
  bills: NonNullable<ReturnType<typeof normalizeBill>>[]
) {
  const fetchedAt = new Date();
  await prisma.$transaction([
    prisma.memberBill.deleteMany({ where: { bioguideId, role } }),
    ...(bills.length
      ? [
          prisma.memberBill.createMany({
            data: bills.map((b) => ({
              bioguideId,
              role: b.role,
              congress: b.congress,
              billType: b.billType,
              billNumber: b.billNumber,
              title: b.title,
              latestAction: b.latestAction,
              congressUrl: b.congressUrl,
              fetchedAt,
            })),
            skipDuplicates: true,
          }),
        ]
      : []),
  ]);
}

async function fetchRoleWithRetry(
  bioguideId: string,
  role: "sponsored" | "cosponsored"
) {
  let lastError: unknown = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const data =
        role === "sponsored"
          ? await fetchSponsoredLegislation(bioguideId, 20)
          : await fetchCosponsoredLegislation(bioguideId, 20);
      const raw = extractBills(
        data,
        role === "sponsored" ? "sponsoredLegislation" : "cosponsoredLegislation"
      );
      return raw
        .map((b: any) => normalizeBill(b, role))
        .filter(Boolean) as NonNullable<ReturnType<typeof normalizeBill>>[];
    } catch (err) {
      lastError = err;
      const delay = 500 * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  throw lastError;
}

export async function syncLegislativeData(opts: {
  chamber?: "senate" | "house";
  limit?: number;
  delayMs?: number;
} = {}) {
  const started = new Date();
  const prisma = await getPrisma();
  if (!prisma) {
    throw new Error("DATABASE_URL is not set or Prisma is unavailable");
  }
  if (!process.env.API_DATA_GOV_KEY) {
    throw new Error("API_DATA_GOV_KEY is not set");
  }

  await recordDatasetFreshness({
    dataset: "legislation",
    status: "running",
  });

  const roster = loadRoster(opts.chamber).slice(0, opts.limit || undefined);
  const delayMs = opts.delayMs ?? 250;
  let membersOk = 0;
  let billsWritten = 0;
  const errors: string[] = [];

  for (const member of roster) {
    const bid = (member.bioguide_id || member.bioguideId || "").toUpperCase();
    if (!bid) continue;

    for (const role of ["sponsored", "cosponsored"] as const) {
      try {
        const bills = await fetchRoleWithRetry(bid, role);
        await replaceMemberRole(prisma, bid, role, bills);
        billsWritten += bills.length;
      } catch (err) {
        errors.push(
          `${bid}/${role}: ${err instanceof Error ? err.message : "error"}`
        );
      }
      await sleep(delayMs);
    }
    membersOk += 1;
    if (membersOk % 25 === 0) {
      console.info(
        `Legislative sync progress: ${membersOk}/${roster.length} members`
      );
    }
  }

  try {
    const recent = await fetchRecentBills(10);
    const rawBills = Array.isArray(recent?.bills) ? recent.bills : [];
    const bills: RecentLegislationBill[] = rawBills
      .map((raw: any) => {
        const congress = Number(raw?.congress);
        const billType = String(raw?.type || "");
        const billNumber = String(raw?.number || "");
        const title = String(raw?.title || "");
        if (!Number.isFinite(congress) || !billType || !billNumber || !title) {
          return null;
        }
        return {
          id: `${congress}-${billType}-${billNumber}`,
          congress,
          billType,
          billNumber,
          title,
          originChamber: raw?.originChamber || null,
          latestAction: raw?.latestAction?.text || null,
          updateDate: raw?.updateDate || raw?.latestAction?.actionDate || null,
          congressUrl:
            buildBillLink({ congress, type: billType, number: billNumber }) ||
            null,
        } satisfies RecentLegislationBill;
      })
      .filter(Boolean) as RecentLegislationBill[];

    if (bills.length > 0) {
      await prisma.recentLegislationCache.upsert({
        where: { id: "latest" },
        create: {
          id: "latest",
          billsJson: JSON.stringify(bills),
          fetchedAt: new Date(),
        },
        update: {
          billsJson: JSON.stringify(bills),
          fetchedAt: new Date(),
        },
      });
      await recordDatasetFreshness({
        dataset: "legislation_recent",
        status: "success",
        recordCount: bills.length,
        successful: true,
      });
    }
  } catch (err) {
    await recordDatasetFreshness({
      dataset: "legislation_recent",
      status: "failed",
      error: err instanceof Error ? err.message : "error",
    });
  }

  const status =
    errors.length === 0
      ? "success"
      : membersOk > 0
        ? "partial"
        : "failed";

  await recordDatasetFreshness({
    dataset: "legislation",
    status,
    recordCount: billsWritten,
    error: errors.length ? errors.slice(0, 20).join("; ") : null,
    successful: status !== "failed",
  });

  return {
    dataset: "legislation",
    status,
    members: roster.length,
    membersProcessed: membersOk,
    billsWritten,
    errors: errors.slice(0, 40),
    startedAt: started.toISOString(),
    completedAt: new Date().toISOString(),
  };
}
