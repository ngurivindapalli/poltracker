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
  pagesFetched: number;
  fetched: number;
  valid: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  inserted: number;
  updated: number;
  skipped: number;
  coverageStart: string | null;
  coverageEnd: string | null;
  unmatchedNames: string[];
  ambiguousNames: string[];
  complete: boolean;
};

/**
 * Sync congress trades from Quiver.
 *
 * Documented endpoints used:
 * - GET /beta/bulk/congresstrading  (paginated full history; includes BioGuideID)
 * - GET /beta/live/congresstrading  (recent overlay)
 *
 * Historical per-ticker `/beta/historical/congresstrading/{ticker}` is NOT used for
 * full-member backfill (would require knowing every ticker first and is N× slower).
 * Bulk already returns the complete allowed history with BioGuideID on each row.
 *
 * Flow: fetch ALL pages → normalize → map BioGuideID → warehouse (JSON) → DB upserts
 * Filtering by politician happens AFTER sync at query time, never during fetch.
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
  const unmatchedSamples: Array<{ name: string; ticker: string | null; date: string | null }> =
    [];

  let matched = 0;
  let unmatched = 0;
  let ambiguous = 0;
  let skipped = 0;
  let pagesFetched = 0;

  try {
    console.log("\n========================================");
    console.log("Quiver Congressional Trading Sync");
    console.log("Starting...");
    console.log("========================================\n");

    const index = await loadPoliticianIndex(c, errors);

    // Full pagination: continue until a short/empty page. Safety cap is a hard ceiling only.
    const pageSize = envInt("QUIVER_TRADES_PAGE_SIZE", 5000);
    const safetyCap = Math.max(envInt("QUIVER_TRADES_MAX_PAGES", 100), 25);
    const pageDelayMs = envInt("QUIVER_TRADES_PAGE_DELAY_MS", 350);
    console.log(
      `[quiver trades] bulk pageSize=${pageSize} safetyCap=${safetyCap} delayMs=${pageDelayMs}`
    );

    let page = 1;
    let rawFetched = 0;
    let lastPageShort = false;
    let hitSafetyCap = false;

    while (page <= safetyCap) {
      const batch = await c.getJson<QuiverBulkCongressTrade[]>(
        QUIVER_ENDPOINTS.bulkCongressTrading,
        {
          query: { page, page_size: pageSize },
          expectArray: true,
          cache: false,
        }
      );

      if (!Array.isArray(batch) || batch.length === 0) {
        lastPageShort = true;
        break;
      }

      pagesFetched += 1;
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
            if (unmatchedSamples.length < 200) {
              unmatchedSamples.push({
                name,
                ticker: n.ticker,
                date: n.transactionDate,
              });
            }
          },
          ambiguous: (name) => {
            ambiguous += 1;
            bump(ambiguousNameCounts, name);
          },
        });
        byHash.set(n.sourceHash, n);
      }

      console.log(
        `[quiver trades] bulk page ${page}: +${batch.length} (unique ${byHash.size})`
      );

      if (batch.length < pageSize) {
        lastPageShort = true;
        break;
      }
      page += 1;
      if (page > safetyCap) {
        hitSafetyCap = true;
        break;
      }
      if (pageDelayMs > 0) await sleep(pageDelayMs);
    }

    // Live overlay
    try {
      const live = await c.getJson<QuiverLiveCongressTrade[]>(
        QUIVER_ENDPOINTS.liveCongressTrading,
        { expectArray: true, cache: false }
      );
      pagesFetched += 1;
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

    // Completeness gates — fail (don't claim SUCCESS) if history looks truncated
    const MIN_FULL_RECORDS = envInt("QUIVER_TRADES_MIN_RECORDS", 50_000);
    const complete =
      lastPageShort &&
      !hitSafetyCap &&
      rawFetched >= MIN_FULL_RECORDS &&
      byHash.size >= Math.floor(MIN_FULL_RECORDS * 0.8);

    if (!complete) {
      const reason = hitSafetyCap
        ? `hit safety cap (${safetyCap} pages) before API exhausted`
        : !lastPageShort
          ? "did not receive a terminal short/empty page"
          : `rawFetched=${rawFetched} below min ${MIN_FULL_RECORDS}`;
      errors.push(`incomplete pagination: ${reason}`);
      console.error("[quiver trades] INCOMPLETE SYNC —", reason);
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

    // Only overwrite warehouse when we have a complete (or explicitly forced partial) dataset
    const allowPartialWrite = process.env.QUIVER_ALLOW_PARTIAL_TRADE_WRITE === "1";
    if (!complete && !allowPartialWrite) {
      throw new Error(
        `Refusing to overwrite trade warehouse with incomplete sync (${errors.join("; ")})`
      );
    }

    // Date coverage
    const dates = rows
      .map((r) => r.transactionDate)
      .filter((d): d is string => Boolean(d))
      .sort();
    const coverageStart = dates[0] ?? null;
    const coverageEnd = dates[dates.length - 1] ?? null;

    writeQuiverJson("congressTrades", rows);
    writeQuiverJson(
      "unmatchedTrades",
      {
        generatedAt: fetchedAt,
        count: unmatched,
        samples: unmatchedSamples,
        topNames: topKeys(unmatchedNameCounts, 100),
      },
      { allowEmpty: true }
    );
    writeQuiverJsonCompatibleTrading(rows);

    // Database warehouse upserts (no Member FK — bioguide stored as plain column)
    const prisma = await getPrismaOptional();
    let inserted = 0;
    let updated = 0;
    if (prisma) {
      const batchSize = 250;
      for (let i = 0; i < rows.length; i += batchSize) {
        const chunk = rows.slice(i, i + batchSize);
        for (const r of chunk) {
          try {
            const existing = await prisma.congressTrade.findUnique({
              where: { sourceHash: r.sourceHash },
              select: { id: true },
            });
            await prisma.congressTrade.upsert({
              where: { sourceHash: r.sourceHash },
              create: mapTradeToDb(r, fetchedAt),
              update: mapTradeToDbUpdate(r, fetchedAt),
            });
            if (existing) updated += 1;
            else inserted += 1;
          } catch (e) {
            skipped += 1;
            if (skipped <= 5) {
              errors.push(`db upsert: ${(e as Error).message}`);
            }
          }
        }
        if (i > 0 && i % 5000 === 0) {
          console.log(`[quiver trades] db upsert progress ${i}/${rows.length}`);
        }
      }

      // Sync audit row
      try {
        await prisma.dataSyncLog.create({
          data: {
            dataset: "congress_trades",
            status: complete && errors.length === 0 ? "success" : "partial",
            startedAt: new Date(startedAt),
            completedAt: new Date(),
            recordsFetched: rawFetched,
            recordsInserted: inserted,
            recordsUpdated: updated,
            recordsSkipped: skipped,
            errors: errors.length ? JSON.stringify(errors.slice(0, 50)) : null,
            meta: JSON.stringify({
              pagesFetched,
              valid: rows.length,
              matched: withBio,
              unmatched: rows.length - withBio,
              coverageStart,
              coverageEnd,
              complete,
            }),
          },
        });
      } catch {
        /* audit table optional if migrate not applied */
      }
    } else {
      inserted = rows.length;
    }

    const status: SyncResult["status"] =
      complete && errors.filter((e) => !e.startsWith("db upsert")).length === 0
        ? "success"
        : complete
          ? "partial"
          : "failed";

    updateMeta("congress_trades", {
      lastUpdated: fetchedAt,
      recordCount: rows.length,
      status,
      pagesFetched,
      rawFetched,
      coverageStart,
      coverageEnd,
      recordsMatched: withBio,
      recordsUnmatched: rows.length - withBio,
      recordsInserted: prisma ? inserted : rows.length,
      recordsUpdated: prisma ? updated : 0,
      message: complete
        ? "Full bulk history synchronized"
        : "Incomplete pagination — warehouse not updated as success",
    });

    const unmatchedNames = topKeys(unmatchedNameCounts, 40);
    const ambiguousNames = topKeys(ambiguousNameCounts, 40);

    const stats: CongressTradeSyncStats = {
      pagesFetched,
      fetched: rawFetched,
      valid: rows.length,
      matched: withBio,
      unmatched: rows.length - withBio,
      ambiguous,
      inserted: prisma ? inserted : rows.length,
      updated: prisma ? updated : 0,
      skipped,
      coverageStart,
      coverageEnd,
      unmatchedNames,
      ambiguousNames,
      complete,
    };

    printTradeSyncReport(stats, status);

    const result: SyncResult & { stats: CongressTradeSyncStats } = {
      dataset: "congress_trades",
      status,
      recordsFetched: rawFetched,
      recordsWritten: rows.length,
      recordsSkipped: skipped,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
      pagesFetched,
      coverageStart,
      coverageEnd,
      recordsMatched: withBio,
      recordsUnmatched: rows.length - withBio,
      recordsInserted: stats.inserted,
      recordsUpdated: stats.updated,
      stats,
    };
    appendSyncLog(result);

    if (!complete) {
      // Non-zero exit for CI
      process.exitCode = 1;
    }
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
      pagesFetched,
    };
    appendSyncLog(result);
    updateMeta("congress_trades", {
      lastUpdated: getDatasetMetaSafe()?.lastUpdated ?? null,
      recordCount: getDatasetMetaSafe()?.recordCount ?? 0,
      status: "failed",
      message: String((e as Error).message),
    });
    console.error("Quiver Congress Trading Sync FAILED:", (e as Error).message);
    process.exitCode = 1;
    return result;
  }
}

function getDatasetMetaSafe() {
  try {
    return readQuiverJson<{ datasets?: { congress_trades?: { lastUpdated?: string; recordCount?: number } } }>(
      "meta"
    )?.datasets?.congress_trades;
  } catch {
    return null;
  }
}

function mapTradeToDb(r: NormalizedCongressTrade, fetchedAt: string) {
  return {
    sourceHash: r.sourceHash,
    bioguideId: r.bioguideId,
    politicianName: r.politicianName,
    chamber: r.chamber,
    party: r.party,
    ticker: r.ticker,
    companyName: r.companyName,
    transaction: r.transaction,
    transactionDate: r.transactionDate ? new Date(r.transactionDate) : null,
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
  };
}

function mapTradeToDbUpdate(r: NormalizedCongressTrade, fetchedAt: string) {
  const base = mapTradeToDb(r, fetchedAt);
  const { sourceHash: _s, ...rest } = base as typeof base & { sourceHash: string };
  return rest;
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
    return;
  }

  counters.unmatched(trade.politicianName);
}

async function loadPoliticianIndex(
  c: QuiverClient,
  errors: string[]
): Promise<PoliticianIndex> {
  const cached = readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth");
  if (cached && cached.length > 0) {
    console.log(`[quiver trades] politician index from warehouse: ${cached.length}`);
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

function printTradeSyncReport(
  stats: CongressTradeSyncStats,
  status: SyncResult["status"]
) {
  console.log("\n========================================");
  console.log("Quiver Congressional Trading Sync");
  console.log("========================================");
  console.log(`Pages fetched:        ${stats.pagesFetched}`);
  console.log(`Raw records fetched:  ${stats.fetched.toLocaleString()}`);
  console.log(`Valid records:        ${stats.valid.toLocaleString()}`);
  console.log(`Matched politicians:  ${stats.matched.toLocaleString()}`);
  console.log(`Unmatched:            ${stats.unmatched.toLocaleString()}`);
  console.log(`Ambiguous:            ${stats.ambiguous.toLocaleString()}`);
  console.log(`Inserted:             ${stats.inserted.toLocaleString()}`);
  console.log(`Updated:              ${stats.updated.toLocaleString()}`);
  console.log(`Skipped:              ${stats.skipped.toLocaleString()}`);
  console.log("");
  console.log("Coverage:");
  console.log(
    `  ${stats.coverageStart || "—"} → ${stats.coverageEnd || "—"}`
  );
  console.log("");
  console.log(`Status: ${status.toUpperCase()}`);
  console.log(`Complete history: ${stats.complete ? "yes" : "NO"}`);
  if (stats.unmatchedNames.length) {
    console.log("\nUnmatched politicians (sample):");
    for (const n of stats.unmatchedNames.slice(0, 20)) console.log(`  - ${n}`);
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
