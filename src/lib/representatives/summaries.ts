import { getPrisma } from "@/lib/db";
import { representatives as staticReps } from "@/data/representatives";
import { senatorImageUrl } from "@/lib/images";
import type {
  RepresentativeSummaryRow,
  RepresentativesListPayload,
} from "./types";

function fromDbRow(r: any): RepresentativeSummaryRow {
  return {
    bioguideId: r.bioguideId,
    name: r.name,
    firstName: r.firstName,
    lastName: r.lastName,
    party: r.party,
    state: r.state,
    district: r.district,
    imageUrl: r.imageUrl,
    chamber: r.chamber || "house",
    estimatedNetWorth: r.estimatedNetWorth,
    tradeCount: r.tradeCount,
    tradeVolume: r.tradeVolume,
    latestTradeDate: r.latestTradeDate
      ? r.latestTradeDate.toISOString().slice(0, 10)
      : null,
    latestFinancialUpdate: r.latestFinancialUpdate
      ? r.latestFinancialUpdate.toISOString()
      : null,
    dataUpdatedAt: r.dataUpdatedAt.toISOString(),
  };
}

function fromStatic(): RepresentativeSummaryRow[] {
  return staticReps.map((r) => ({
    bioguideId: r.bioguideId,
    name: r.name,
    firstName: null,
    lastName: null,
    party: r.party,
    state: r.state,
    district: r.district != null ? String(r.district) : null,
    imageUrl: r.imageUrl || senatorImageUrl(r.bioguideId),
    chamber: "house",
    estimatedNetWorth: null,
    tradeCount: null,
    tradeVolume: null,
    latestTradeDate: null,
    latestFinancialUpdate: null,
    dataUpdatedAt: new Date(0).toISOString(),
  }));
}

export async function getRepresentativeSummaries(): Promise<RepresentativesListPayload> {
  try {
    const prisma = await getPrisma();
    if (prisma?.representativeSummary) {
      const rows = await prisma.representativeSummary.findMany({
        orderBy: { name: "asc" },
      });
      if (rows.length >= 50) {
        const mapped = rows.map(fromDbRow);
        let dataUpdatedAt: string | null = null;
        for (const r of mapped) {
          if (!dataUpdatedAt || r.dataUpdatedAt > dataUpdatedAt) {
            dataUpdatedAt = r.dataUpdatedAt;
          }
        }
        return {
          representatives: mapped,
          dataUpdatedAt,
          source: "RepresentativeSummary",
          count: mapped.length,
        };
      }
    }
  } catch (e) {
    console.warn(
      "[rep summaries] DB read failed, static fallback:",
      (e as Error).message
    );
  }

  const mapped = fromStatic();
  return {
    representatives: mapped,
    dataUpdatedAt: null,
    source: "RepresentativeSummary",
    count: mapped.length,
  };
}

export async function getRepresentativeSummary(
  bioguideId: string
): Promise<RepresentativeSummaryRow | null> {
  const bid = bioguideId.toUpperCase();
  try {
    const prisma = await getPrisma();
    if (prisma?.representativeSummary) {
      const row = await prisma.representativeSummary.findUnique({
        where: { bioguideId: bid },
      });
      if (row) return fromDbRow(row);
    }
  } catch {
    /* static */
  }
  return fromStatic().find((r) => r.bioguideId.toUpperCase() === bid) ?? null;
}
