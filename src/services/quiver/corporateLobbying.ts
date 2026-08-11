import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizeLobbying } from "@/lib/quiver/normalizers";
import type {
  NormalizedLobbying,
  QuiverLobbying,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

export async function syncCorporateLobbying(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedLobbying>();

  try {
    const live = await c.getJson<QuiverLobbying[]>(
      QUIVER_ENDPOINTS.liveLobbying,
      { expectArray: true, cache: false }
    );
    for (const row of live) {
      const n = normalizeLobbying(row, fetchedAt);
      if (n) byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero lobbying rows — refusing overwrite");
    }

    const list = [...byHash.values()];
    writeQuiverJson("corporateLobbying", list);

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          await prisma.corporateLobbying.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              ticker: r.ticker,
              date: r.date ? new Date(r.date) : null,
              amount: r.amount,
              client: r.client,
              issue: r.issue,
              specificIssue: r.specificIssue,
              registrant: r.registrant,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              amount: r.amount,
              issue: r.issue,
              specificIssue: r.specificIssue,
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

    updateMeta("corporate_lobbying", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
    });

    const result: SyncResult = {
      dataset: "corporate_lobbying",
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
      dataset: "corporate_lobbying",
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
