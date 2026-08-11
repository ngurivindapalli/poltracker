import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizeOffExchange } from "@/lib/quiver/normalizers";
import type {
  NormalizedOffExchange,
  QuiverOffExchange,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

/** Off-exchange is ticker/company data — never politician-scoped. */
export async function syncOffExchange(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedOffExchange>();

  try {
    const live = await c.getJson<QuiverOffExchange[]>(
      QUIVER_ENDPOINTS.liveOffExchange,
      { expectArray: true, cache: false }
    );
    for (const row of live) {
      const n = normalizeOffExchange(row, fetchedAt);
      if (n) byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero off-exchange rows — refusing overwrite");
    }

    const list = [...byHash.values()];
    writeQuiverJson("offExchange", list);

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          await prisma.offExchangeTrade.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              ticker: r.ticker,
              date: r.date ? new Date(r.date) : null,
              otcShort: r.otcShort,
              otcTotal: r.otcTotal,
              dpi: r.dpi,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              otcShort: r.otcShort,
              otcTotal: r.otcTotal,
              dpi: r.dpi,
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

    updateMeta("off_exchange", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
    });

    const result: SyncResult = {
      dataset: "off_exchange",
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
      dataset: "off_exchange",
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
