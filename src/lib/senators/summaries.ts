/**
 * Read path for Senator listing summaries.
 * Prefer PostgreSQL; fall back to Quiver warehouse JSON written at sync time.
 * Never calls Quiver or Congress.gov at request time.
 */

import {
  getDatasetLastUpdated,
  getDatasetMeta,
  readQuiverJson,
} from "@/lib/quiver/cache";
import { getPrismaOptional } from "@/lib/quiver/prisma";
import type { SenatorsListPayload, SenatorSummaryRow } from "./types";

function fromDbRow(r: {
  bioguideId: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  party: string | null;
  state: string | null;
  imageUrl: string | null;
  chamber: string;
  estimatedNetWorth: number | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  latestTradeDate: Date | null;
  latestFinancialUpdate: Date | null;
  dataUpdatedAt: Date;
}): SenatorSummaryRow {
  return {
    bioguideId: r.bioguideId,
    name: r.name,
    firstName: r.firstName,
    lastName: r.lastName,
    party: r.party,
    state: r.state,
    imageUrl: r.imageUrl,
    chamber: r.chamber,
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

export async function getSenatorSummaries(): Promise<SenatorsListPayload> {
  try {
    const prisma = await getPrismaOptional();
    if (prisma?.senatorSummary) {
      const rows = await prisma.senatorSummary.findMany({
        orderBy: { name: "asc" },
      });
      if (rows.length >= 50) {
        const mapped = rows.map(fromDbRow);
        let dataUpdatedAt: string | null = null;
        for (const r of mapped) {
          if (!r.dataUpdatedAt) continue;
          if (!dataUpdatedAt || r.dataUpdatedAt > dataUpdatedAt) {
            dataUpdatedAt = r.dataUpdatedAt;
          }
        }
        if (!dataUpdatedAt) {
          dataUpdatedAt = getDatasetLastUpdated("senator_summaries");
        }
        return {
          senators: mapped,
          dataUpdatedAt,
          source: "SenatorSummary",
          count: mapped.length,
        };
      }
    }
  } catch (e) {
    console.warn(
      "[senator summaries] DB read failed, warehouse fallback:",
      (e as Error).message
    );
  }

  const warehouse =
    readQuiverJson<SenatorSummaryRow[]>("senatorSummaries") ?? [];
  const meta = getDatasetMeta("senator_summaries");
  const sorted = [...warehouse].sort((a, b) => a.name.localeCompare(b.name));
  return {
    senators: sorted,
    dataUpdatedAt:
      meta?.lastUpdated ||
      sorted[0]?.dataUpdatedAt ||
      getDatasetLastUpdated("politician_net_worth"),
    source: "SenatorSummary",
    count: sorted.length,
  };
}

export async function getSenatorSummary(
  bioguideId: string
): Promise<SenatorSummaryRow | null> {
  const bid = bioguideId.toUpperCase();
  try {
    const prisma = await getPrismaOptional();
    if (prisma?.senatorSummary) {
      const row = await prisma.senatorSummary.findUnique({
        where: { bioguideId: bid },
      });
      if (row) return fromDbRow(row);
    }
  } catch {
    /* warehouse */
  }
  const warehouse =
    readQuiverJson<SenatorSummaryRow[]>("senatorSummaries") ?? [];
  return (
    warehouse.find((s) => s.bioguideId.toUpperCase() === bid) ?? null
  );
}
