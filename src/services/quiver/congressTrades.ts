import { envInt } from "@/lib/quiver/env";
import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import {
  appendSyncLog,
  readQuiverJson,
  updateMeta,
  writeQuiverJson,
} from "@/lib/quiver/cache";
import {
  normalizeBulkCongressTrade,
  normalizeLiveCongressTrade,
  normalizePolitician,
} from "@/lib/quiver/normalizers";
import { PoliticianIndex } from "@/lib/quiver/identity";
import type {
  NormalizedCongressTrade,
  NormalizedNetWorth,
  QuiverBulkCongressTrade,
  QuiverLiveCongressTrade,
  QuiverPolitician,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

export type CongressTradeSyncStats = {
  fetched: number;
  matched: number;
  inserted: number;
  updated: number;
  skipped: number;
  unmatched: number;
  ambiguous: number;
  unmatchedNames: string[];
  ambiguousNames: string[];
};

/**
 * Sync congress trades from Quiver.
 *
 * Primary source: GET /beta/bulk/congresstrading (paginated full history).
 * Each row includes BioGuideID — that is the canonical match key.
 * Overlay: GET /beta/live/congresstrading for recent freshness.
 *
 * Historical /beta/historical/congresstrading/{ticker} is documented as
 * ticker-scoped and is inefficient for full politician backfill; bulk already
 * carries BioGuideID on every row and is preferred for full sync.
 *
 * Does NOT invent holdings from trades. Never clears cache on empty/failed fetch.
 */
export async function syncCongressTrades(
  client?: QuiverClient
): Promise<SyncResult & { stats?: CongressTradeSyncStats }> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedCongressTrade>();
  const unmatchedNameCounts = new Map<string, number>();
  const ambiguousNameCounts = new Map<string, number>();

  let matched = 0;
  let unmatched = 0;
  let ambiguous = 0;
  let skipped = 0;

  try {
    // Build identity index from politician roster (BioGuide map + safe name index)
    const index = await loadPoliticianIndex(c, errors);

    // Full bulk pagination — Booker's older trades sit near the *end* of the feed
    // (~115k rows ≈ 23 pages @ 5k). Defaults ensure full history; env can raise further.
    const pageSize = envInt("QUIVER_TRADES_PAGE_SIZE", 5000);
    const maxPages = envInt("QUIVER_TRADES_MAX_PAGES", 80);
    const pageDelayMs = envInt("QUIVER_TRADES_PAGE_DELAY_MS", 300);
    console.log(
      `[quiver trades] bulk sync pageSize=${pageSize} maxPages=${maxPages} pageDelayMs=${pageDelayMs}`
    );

    let page = 1;
    let rawFetched = 0;
    while (page <= maxPages) {
      const batch = await c.getJson<QuiverBulkCongressTrade[]>(
        QUIVER_ENDPOINTS.bulkCongressTrading,
        {
          query: { page, page_size: pageSize },
          expectArray: true,
          cache: false,
        }
      );
      if (!Array.isArray(batch) || batch.length === 0) break;

      rawFetched += batch.length;
      for (const row of batch) {
        const n = normalizeBulkCongressTrade(row, fetchedAt);
        if (!n) {
          skipped += 1;
          continue;
        }
        attachIdentity(n, index, {
          matched: () => {
            matched += 1;
          },
          unmatched: (name) => {
            unmatched += 1;
            bump(unmatchedNameCounts, name);
          },
          ambiguous: (name) => {
            ambiguous += 1;
            bump(ambiguousNameCounts, name);
          },
        });
        byHash.set(n.sourceHash, n);
      }

      console.log(
        `[quiver trades] bulk page ${page}: +${batch.length} (unique hashes ${byHash.size})`
      );

      if (batch.length < pageSize) break;
      page += 1;
      if (pageDelayMs > 0) await sleep(pageDelayMs);
    }

    // Live overlay (same shape as historical-by-ticker rows)
    try {
      const live = await c.getJson<QuiverLiveCongressTrade[]>(
        QUIVER_ENDPOINTS.liveCongressTrading,
        { expectArray: true, cache: false }
      );
      for (const row of live) {
        const n = normalizeLiveCongressTrade(row, fetchedAt);
        if (!n) {
          skipped += 1;
          continue;
        }
        attachIdentity(n, index, {
          matched: () => {
            matched += 1;
          },
          unmatched: (name) => {
            unmatched += 1;
            bump(unmatchedNameCounts, name);
          },
          ambiguous: (name) => {
            ambiguous += 1;
            bump(ambiguousNameCounts, name);
          },
        });
        byHash.set(n.sourceHash, n);
      }
      rawFetched += live.length;
      console.log(`[quiver trades] live overlay: ${live.length} rows`);
    } catch (e) {
      errors.push(`live overlay: ${(e as Error).message}`);
    }

    if (byHash.size === 0) {
      throw new Error("Quiver returned zero congress trades — refusing overwrite");
    }

    const rows = [...byHash.values()].sort((a, b) =>
      String(b.transactionDate || "").localeCompare(String(a.transactionDate || ""))
    );

    const withBio = rows.filter((r) => r.bioguideId).length;
    if (withBio === 0) {
      throw new Error(
        "All congress trades lack BioGuideID after matching — refusing overwrite"
      );
    }

    writeQuiverJson("congressTrades", rows);
    writeQuiverJsonCompatibleTrading(rows);

    const prisma = await getPrismaOptional();
    let inserted = 0;
    let updated = 0;
    if (prisma) {
      for (const r of rows) {
        try {
          const existing = await prisma.congressTrade.findUnique({
            where: { sourceHash: r.sourceHash },
            select: { id: true },
          });
          await prisma.congressTrade.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              bioguideId: r.bioguideId,
              politicianName: r.politicianName,
              chamber: r.chamber,
              party: r.party,
              ticker: r.ticker,
              companyName: r.companyName,
              transaction: r.transaction,
              transactionDate: r.transactionDate
                ? new Date(r.transactionDate)
                : null,
              reportDate: r.reportDate ? new Date(r.reportDate) : null,
              amount: r.amount,
              amountRange: r.amountRange,
              tickerType: r.tickerType,
              excessReturn: r.excessReturn,
              priceChange: r.priceChange,
              spyChange: r.spyChange,
              description: r.description,
              owner: r.owner,
              district: r.district,
              state: r.state,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              bioguideId: r.bioguideId,
              politicianName: r.politicianName,
              chamber: r.chamber,
              party: r.party,
              ticker: r.ticker,
              companyName: r.companyName,
              transaction: r.transaction,
              transactionDate: r.transactionDate
                ? new Date(r.transactionDate)
                : null,
              reportDate: r.reportDate ? new Date(r.reportDate) : null,
              amount: r.amount,
              amountRange: r.amountRange,
              excessReturn: r.excessReturn,
              priceChange: r.priceChange,
              spyChange: r.spyChange,
              description: r.description,
              owner: r.owner,
              district: r.district,
              state: r.state,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
          });
          if (existing) updated += 1;
          else inserted += 1;
        } catch {
          // Rows may reference missing Member FK; JSON cache still holds them
          skipped += 1;
        }
      }
    } else {
      inserted = rows.length;
    }

    updateMeta("congress_trades", {
      lastUpdated: fetchedAt,
      recordCount: rows.length,
      status: errors.length ? "partial" : "success",
    });

    const unmatchedNames = topKeys(unmatchedNameCounts, 40);
    const ambiguousNames = topKeys(ambiguousNameCounts, 40);

    const stats: CongressTradeSyncStats = {
      fetched: rawFetched,
      matched: withBio,
      inserted: prisma ? inserted : rows.length,
      updated: prisma ? updated : 0,
      skipped,
      unmatched: rows.length - withBio,
      ambiguous,
      unmatchedNames,
      ambiguousNames,
    };

    printTradeSyncReport(stats);

    const result: SyncResult & { stats: CongressTradeSyncStats } = {
      dataset: "congress_trades",
      status: errors.length ? "partial" : "success",
      recordsFetched: rawFetched,
      recordsWritten: rows.length,
      recordsSkipped: skipped,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      stats,
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "congress_trades",
      status: "failed",
      recordsFetched: byHash.size,
      recordsWritten: 0,
      recordsSkipped: skipped,
      errors: [String((e as Error).message)],
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    console.error("Quiver Congress Trading Sync FAILED:", (e as Error).message);
    return result;
  }
}

function attachIdentity(
  trade: NormalizedCongressTrade,
  index: PoliticianIndex,
  counters: {
    matched: () => void;
    unmatched: (name: string) => void;
    ambiguous: (name: string) => void;
  }
) {
  const resolved = index.resolve({
    bioguideId: trade.bioguideId,
    name: trade.politicianName,
    chamber: trade.chamber,
    party: trade.party,
    state: trade.state,
  });

  if (resolved.bioguideId) {
    trade.bioguideId = resolved.bioguideId;
    counters.matched();
    return;
  }

  if (resolved.status === "ambiguous") {
    counters.ambiguous(trade.politicianName);
    // leave bioguideId null — do not invent a match
    return;
  }

  counters.unmatched(trade.politicianName);
}

async function loadPoliticianIndex(
  c: QuiverClient,
  errors: string[]
): Promise<PoliticianIndex> {
  // Prefer local net-worth cache when present (full roster from last networth sync).
  const cached = readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth");
  if (cached && cached.length > 0) {
    console.log(
      `[quiver trades] politician index from cache: ${cached.length}`
    );
    return PoliticianIndex.fromNetWorth(cached);
  }

  const rows: NormalizedNetWorth[] = [];
  try {
    const maxPages = envInt("QUIVER_NETWORTH_MAX_PAGES", 50);
    const pols = await c.getPaginatedData<QuiverPolitician>(
      QUIVER_ENDPOINTS.bulkPoliticians,
      { pageSize: 500, maxPages }
    );
    for (const row of pols) {
      const n = normalizePolitician(row, new Date().toISOString());
      if (n) rows.push(n);
    }
    console.log(`[quiver trades] politician index size: ${rows.length}`);
  } catch (e) {
    errors.push(`politician index: ${(e as Error).message}`);
  }
  return PoliticianIndex.fromNetWorth(rows);
}

function printTradeSyncReport(stats: CongressTradeSyncStats) {
  console.log("\n========================================");
  console.log("Quiver Congress Trading Sync");
  console.log("========================================");
  console.log(`Fetched:   ${stats.fetched}`);
  console.log(`Matched:   ${stats.matched} (with BioGuideID)`);
  console.log(`Inserted:  ${stats.inserted}`);
  console.log(`Updated:   ${stats.updated}`);
  console.log(`Skipped:   ${stats.skipped}`);
  console.log(`Unmatched: ${stats.unmatched}`);
  console.log(`Ambiguous: ${stats.ambiguous}`);
  if (stats.unmatchedNames.length) {
    console.log("Unmatched politicians (sample):");
    for (const n of stats.unmatchedNames) console.log(`  - ${n}`);
  }
  if (stats.ambiguousNames.length) {
    console.log("Ambiguous name matches (sample, not assigned):");
    for (const n of stats.ambiguousNames) console.log(`  - ${n}`);
  }
  console.log("========================================\n");
}

function bump(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) || 0) + 1);
}

function topKeys(map: Map<string, number>, n: number): string[] {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k, c]) => `${k} (${c})`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeQuiverJsonCompatibleTrading(rows: NormalizedCongressTrade[]) {
  // Keep src/data/congress-trading-all.json shape used by older estimate modules
  // ONLY with quiver-sourced rows so legacy loaders also see Quiver SoT.
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");
  const out = rows
    .filter((r) => r.bioguideId)
    .map((r) => ({
      BioGuideID: r.bioguideId,
      Name: r.politicianName,
      Traded: r.transactionDate,
      Filed: r.reportDate,
      Transaction: r.transaction,
      Trade_Size_USD: r.amountRange || r.amount,
      Company: r.companyName,
      Ticker: r.ticker,
      Chamber: r.chamber,
      Party: r.party,
      State: r.state,
      TickerType: r.tickerType,
      Comments: r.description,
      Subholding: r.owner,
      source: "quiver",
    }));
  const p = path.join(process.cwd(), "src", "data", "congress-trading-all.json");
  if (out.length > 0) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(out));
  }

  const senate = path.join(process.cwd(), "public", "data", "senateTrades.json");
  const sOut = rows.map((r) => ({
    senator: r.politicianName,
    bioguideId: r.bioguideId,
    ticker: r.ticker,
    asset: r.companyName,
    assetType: r.tickerType,
    type: r.transaction,
    buySell: null,
    transactionDate: r.transactionDate,
    reportDate: r.reportDate,
    amount: r.amountRange || r.amount,
    owner: r.owner,
    comment: r.description,
    source: "quiver",
  }));
  if (sOut.length > 0) {
    fs.mkdirSync(path.dirname(senate), { recursive: true });
    fs.writeFileSync(senate, JSON.stringify(sOut));
  }
}
