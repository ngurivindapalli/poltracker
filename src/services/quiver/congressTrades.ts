import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import {
  appendSyncLog,
  updateMeta,
  writeQuiverJson,
} from "@/lib/quiver/cache";
import {
  normalizeBulkCongressTrade,
  normalizeLiveCongressTrade,
} from "@/lib/quiver/normalizers";
import type {
  NormalizedCongressTrade,
  QuiverBulkCongressTrade,
  QuiverLiveCongressTrade,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

/**
 * Sync congress trades from Quiver.
 * Preferred: bulk historical (page_size) + live for freshness merge.
 * Never clears production cache on empty/failed fetch.
 */
export async function syncCongressTrades(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const errors: string[] = [];
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedCongressTrade>();

  try {
    // Bulk historical (paginate aggressively but cap for runtime safety)
    let page = 1;
    const pageSize = 5000;
    const maxPages = Number(process.env.QUIVER_TRADES_MAX_PAGES || 40);
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
      for (const row of batch) {
        const n = normalizeBulkCongressTrade(row, fetchedAt);
        if (n) byHash.set(n.sourceHash, n);
      }
      if (batch.length < pageSize) break;
      page += 1;
    }

    // Live overlay
    try {
      const live = await c.getJson<QuiverLiveCongressTrade[]>(
        QUIVER_ENDPOINTS.liveCongressTrading,
        { expectArray: true, cache: false }
      );
      for (const row of live) {
        const n = normalizeLiveCongressTrade(row, fetchedAt);
        if (n) byHash.set(n.sourceHash, n);
      }
    } catch (e) {
      errors.push(`live overlay: ${(e as Error).message}`);
    }

    if (byHash.size === 0) {
      throw new Error("Quiver returned zero congress trades — refusing overwrite");
    }

    const rows = [...byHash.values()].sort((a, b) =>
      String(b.transactionDate || "").localeCompare(String(a.transactionDate || ""))
    );

    writeQuiverJson("congressTrades", rows);

    // Compatible legacy shape for any remaining consumers (deprecated path)
    writeQuiverJsonCompatibleTrading(rows);

    const prisma = await getPrismaOptional();
    let inserted = 0;
    if (prisma) {
      for (const r of rows) {
        try {
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
              amount: r.amount,
              amountRange: r.amountRange,
              excessReturn: r.excessReturn,
              priceChange: r.priceChange,
              spyChange: r.spyChange,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
          });
          inserted += 1;
        } catch {
          // Skip rows that reference missing members FK — cache still holds them
        }
      }
    }

    updateMeta("congress_trades", {
      lastUpdated: fetchedAt,
      recordCount: rows.length,
      status: errors.length ? "partial" : "success",
    });

    const result: SyncResult = {
      dataset: "congress_trades",
      status: errors.length ? "partial" : "success",
      recordsFetched: rows.length,
      recordsWritten: rows.length,
      recordsSkipped: 0,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "congress_trades",
      status: "failed",
      recordsFetched: byHash.size,
      recordsWritten: 0,
      recordsSkipped: 0,
      errors: [String((e as Error).message)],
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  }
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
