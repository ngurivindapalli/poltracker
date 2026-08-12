/**
 * Rebuild SenatorSummary rows from local roster + synchronized Quiver warehouse.
 * Runs after trades/networth sync — never called from request path against Quiver.
 */

import fs from "fs";
import path from "path";
import {
  appendSyncLog,
  getDatasetLastUpdated,
  readQuiverJson,
  updateMeta,
  writeQuiverJson,
} from "@/lib/quiver/cache";
import { getPrismaOptional } from "@/lib/quiver/prisma";
import { senatorImageUrl } from "@/lib/images";
import type {
  NormalizedCongressTrade,
  NormalizedNetWorth,
  SyncResult,
} from "@/lib/quiver/types";
import type { SenatorSummaryRow } from "@/lib/senators/types";

type RosterMember = {
  name: string;
  bioguide_id: string;
  state?: string;
  party?: string;
  role?: string;
};

function loadSenatorRoster(): RosterMember[] {
  try {
    const p = path.join(process.cwd(), "data", "poltracker_congress_dataset.json");
    const raw = JSON.parse(fs.readFileSync(p, "utf8")) as RosterMember[];
    return raw.filter((m) => m.role === "Senator" && m.bioguide_id);
  } catch (e) {
    console.warn("[senator summaries] roster load failed:", (e as Error).message);
    return [];
  }
}

function splitName(name: string): { firstName: string; lastName: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: name, lastName: name };
  if (parts.length === 1) return { firstName: parts[0], lastName: parts[0] };
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") };
}

function aggregateTrades(trades: NormalizedCongressTrade[]) {
  const map = new Map<
    string,
    { count: number; latest: string | null }
  >();
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

export async function rebuildSenatorSummaries(): Promise<SyncResult> {
  const startedAt = new Date().toISOString();
  const errors: string[] = [];

  try {
    const roster = loadSenatorRoster();
    if (roster.length === 0) {
      throw new Error("No senator roster found in poltracker_congress_dataset.json");
    }

    const netWorth =
      readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
    const trades =
      readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
    const nwByBio = new Map(
      netWorth.map((p) => [p.bioguideId.toUpperCase(), p] as const)
    );
    const tradeAgg = aggregateTrades(trades);

    const tradesUpdated = getDatasetLastUpdated("congress_trades");
    const nwUpdated = getDatasetLastUpdated("politician_net_worth");
    const financialStamp = [tradesUpdated, nwUpdated]
      .filter(Boolean)
      .sort()
      .pop() as string | undefined;
    const dataUpdatedAt = startedAt;

    const rows: SenatorSummaryRow[] = roster.map((m) => {
      const bioguideId = m.bioguide_id.toUpperCase();
      const nw = nwByBio.get(bioguideId);
      const tr = tradeAgg.get(bioguideId);
      const name = nw?.name || m.name;
      const { firstName, lastName } = splitName(name);
      const tradeCount =
        tr?.count != null
          ? tr.count
          : nw?.tradeCount != null
            ? nw.tradeCount
            : 0;
      return {
        bioguideId,
        name,
        firstName,
        lastName,
        party: nw?.party || m.party || null,
        // Prefer local roster state codes (e.g. NJ) for listing filters
        state: m.state || nw?.state || null,
        imageUrl: nw?.imageUrl || senatorImageUrl(bioguideId),
        chamber: "senate",
        estimatedNetWorth: nw?.netWorth ?? null,
        tradeCount,
        tradeVolume: nw?.tradeVolume ?? null,
        latestTradeDate: tr?.latest ?? null,
        latestFinancialUpdate: financialStamp || nw?.fetchedAt || dataUpdatedAt,
        dataUpdatedAt,
      };
    });

    rows.sort((a, b) => a.name.localeCompare(b.name));
    writeQuiverJson("senatorSummaries", rows);

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma?.senatorSummary) {
      for (const r of rows) {
        try {
          await prisma.senatorSummary.upsert({
            where: { bioguideId: r.bioguideId },
            create: {
              bioguideId: r.bioguideId,
              name: r.name,
              firstName: r.firstName,
              lastName: r.lastName,
              party: r.party,
              state: r.state,
              imageUrl: r.imageUrl,
              chamber: "senate",
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

    updateMeta("senator_summaries", {
      lastUpdated: dataUpdatedAt,
      recordCount: rows.length,
      status: errors.length ? "partial" : "success",
      message: "Rebuilt from local roster + Quiver warehouse (no live Quiver)",
    });

    console.log("\n========================================");
    console.log("Senator Summary Rebuild");
    console.log("========================================");
    console.log(`Roster:   ${roster.length}`);
    console.log(`Written:  ${written}`);
    console.log(`With NW:  ${rows.filter((r) => r.estimatedNetWorth != null).length}`);
    console.log(`With trades: ${rows.filter((r) => (r.tradeCount || 0) > 0).length}`);
    console.log("========================================\n");

    const result: SyncResult = {
      dataset: "senator_summaries",
      status: errors.length ? "partial" : "success",
      recordsFetched: roster.length,
      recordsWritten: written,
      recordsSkipped: 0,
      errors: errors.slice(0, 30),
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "senator_summaries",
      status: "failed",
      recordsFetched: 0,
      recordsWritten: 0,
      recordsSkipped: 0,
      errors: [String((e as Error).message)],
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    updateMeta("senator_summaries", {
      lastUpdated: getDatasetLastUpdated("senator_summaries"),
      recordCount: 0,
      status: "failed",
      message: String((e as Error).message),
    });
    return result;
  }
}
