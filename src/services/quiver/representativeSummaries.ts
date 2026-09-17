import fs from "fs";
import path from "path";
import { getPrisma } from "@/lib/db";
import { recordDatasetFreshness } from "@/lib/sync/freshness";
import { senatorImageUrl } from "@/lib/images";
import {
  getDatasetLastUpdated,
  readQuiverJson,
} from "@/lib/quiver/cache";
import type {
  NormalizedCongressTrade,
  NormalizedNetWorth,
  SyncResult,
} from "@/lib/quiver/types";
import type { RepresentativeSummaryRow } from "@/lib/representatives/types";
import { representatives as staticReps } from "@/data/representatives";

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return { firstName: name, lastName: name };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function aggregateTrades(trades: NormalizedCongressTrade[]) {
  const map = new Map<string, { count: number; latest: string | null }>();
  for (const t of trades) {
    const bid = (t.bioguideId || "").toUpperCase();
    if (!bid) continue;
    const prev = map.get(bid) || { count: 0, latest: null as string | null };
    prev.count += 1;
    const d = t.transactionDate || null;
    if (d && (!prev.latest || d > prev.latest)) prev.latest = d;
    map.set(bid, prev);
  }
  return map;
}

function loadHouseRoster() {
  try {
    const p = path.join(process.cwd(), "data", "poltracker_congress_dataset.json");
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as Array<{
      name: string;
      bioguide_id: string;
      state?: string;
      party?: string;
      role?: string;
      district?: string | number;
    }>;
    return raw.filter((m) => m.role === "Representative" && m.bioguide_id);
  } catch {
    return staticReps.map((r) => ({
      name: r.name,
      bioguide_id: r.bioguideId,
      state: r.state,
      party: r.party,
      role: "Representative",
      district: r.district,
    }));
  }
}

export async function rebuildRepresentativeSummaries(): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const roster = loadHouseRoster();
  const netWorth = readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
  const trades = readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
  const nwByBio = new Map(
    netWorth.map((p) => [p.bioguideId.toUpperCase(), p] as const)
  );
  const tradeAgg = aggregateTrades(trades);
  const tradesUpdated = getDatasetLastUpdated("congress_trades");
  const nwUpdated = getDatasetLastUpdated("politician_net_worth");
  const financialStamp = [tradesUpdated, nwUpdated].filter(Boolean).sort().pop();
  const dataUpdatedAt = startedAt;

  const rows: RepresentativeSummaryRow[] = roster.map((m) => {
    const bioguideId = m.bioguide_id.toUpperCase();
    const nw = nwByBio.get(bioguideId);
    const tr = tradeAgg.get(bioguideId);
    const name = nw?.name || m.name;
    const { firstName, lastName } = splitName(name);
    return {
      bioguideId,
      name,
      firstName,
      lastName,
      party: nw?.party || m.party || null,
      state: m.state || nw?.state || null,
      district: m.district != null ? String(m.district) : null,
      imageUrl: nw?.imageUrl || senatorImageUrl(bioguideId),
      chamber: "house",
      estimatedNetWorth: nw?.netWorth ?? null,
      tradeCount: tr?.count ?? nw?.tradeCount ?? 0,
      tradeVolume: nw?.tradeVolume ?? null,
      latestTradeDate: tr?.latest ?? null,
      latestFinancialUpdate: financialStamp || nw?.fetchedAt || dataUpdatedAt,
      dataUpdatedAt,
    };
  });

  const prisma = await getPrisma();
  let written = 0;
  if (prisma?.representativeSummary) {
    for (const r of rows) {
      try {
        await prisma.representativeSummary.upsert({
          where: { bioguideId: r.bioguideId },
          create: {
            bioguideId: r.bioguideId,
            name: r.name,
            firstName: r.firstName,
            lastName: r.lastName,
            party: r.party,
            state: r.state,
            district: r.district,
            imageUrl: r.imageUrl,
            chamber: "house",
            estimatedNetWorth: r.estimatedNetWorth,
            tradeCount: r.tradeCount,
            tradeVolume: r.tradeVolume,
            latestTradeDate: r.latestTradeDate
              ? new Date(r.latestTradeDate)
              : null,
            latestFinancialUpdate: r.latestFinancialUpdate
              ? new Date(r.latestFinancialUpdate)
              : null,
            dataUpdatedAt: new Date(r.dataUpdatedAt),
          },
          update: {
            name: r.name,
            firstName: r.firstName,
            lastName: r.lastName,
            party: r.party,
            state: r.state,
            district: r.district,
            imageUrl: r.imageUrl,
            estimatedNetWorth: r.estimatedNetWorth,
            tradeCount: r.tradeCount,
            tradeVolume: r.tradeVolume,
            latestTradeDate: r.latestTradeDate
              ? new Date(r.latestTradeDate)
              : null,
            latestFinancialUpdate: r.latestFinancialUpdate
              ? new Date(r.latestFinancialUpdate)
              : null,
            dataUpdatedAt: new Date(r.dataUpdatedAt),
          },
        });
        written += 1;
      } catch (e) {
        errors.push(`${r.bioguideId}: ${(e as Error).message}`);
      }
    }
  } else {
    written = rows.length;
  }

  await recordDatasetFreshness({
    dataset: "representative_summaries",
    status: errors.length ? "partial" : "success",
    recordCount: written,
    successful: written > 0,
    error: errors.length ? errors.slice(0, 10).join("; ") : null,
  });

  return {
    dataset: "representative_summaries",
    status: errors.length ? "partial" : "success",
    recordsFetched: roster.length,
    recordsWritten: written,
    recordsSkipped: 0,
    errors: errors.slice(0, 30),
    startedAt,
    completedAt: new Date().toISOString(),
  };
}
