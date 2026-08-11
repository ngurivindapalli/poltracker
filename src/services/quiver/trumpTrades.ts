import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizeTrumpTrade } from "@/lib/quiver/normalizers";
import type {
  NormalizedTrumpTrade,
  QuiverTrumpTrade,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

/**
 * Donald Trump stock trades.
 * Official verified endpoint: GET /beta/bulk/trumpstocktrades
 * Fields: Ticker, Company, Transaction, Amount, Filed, Traded, ExcessReturn
 */
export async function syncTrumpTrades(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedTrumpTrade>();

  try {
    const rows = await c.getJson<QuiverTrumpTrade[]>(
      QUIVER_ENDPOINTS.bulkTrumpStockTrades,
      { expectArray: true, cache: false }
    );

    for (const row of rows) {
      const n = normalizeTrumpTrade(row, fetchedAt);
      if (n) byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero Trump trades — refusing overwrite");
    }

    const list = [...byHash.values()].sort((a, b) =>
      String(b.transactionDate || "").localeCompare(
        String(a.transactionDate || "")
      )
    );
    writeQuiverJson("trumpTrades", list);

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          await prisma.trumpTrade.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              ticker: r.ticker,
              company: r.company,
              transaction: r.transaction,
              transactionDate: r.transactionDate
                ? new Date(r.transactionDate)
                : null,
              reportDate: r.reportDate ? new Date(r.reportDate) : null,
              amount: r.amount,
              amountRange: r.amountRange,
              excessReturn: r.excessReturn,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              excessReturn: r.excessReturn,
              amount: r.amount,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
          });
          written += 1;
        } catch {
          /* skip */
        }
      }
    }

    updateMeta("trump_trades", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
    });

    const result: SyncResult = {
      dataset: "trump_trades",
      status: "success",
      recordsFetched: list.length,
      recordsWritten: prisma ? written : list.length,
      recordsSkipped: 0,
      errors: [],
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "trump_trades",
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
