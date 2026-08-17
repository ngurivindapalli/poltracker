import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import {
  appendSyncLog,
  readQuiverJson,
  updateMeta,
  writeQuiverJson,
} from "@/lib/quiver/cache";
import { PoliticianIndex } from "@/lib/quiver/identity";
import { normalizeCongressHolding } from "@/lib/quiver/normalizers";
import type {
  NormalizedCongressHolding,
  NormalizedNetWorth,
  QuiverCongressHolding,
  SyncResult,
} from "@/lib/quiver/types";

/**
 * Congress stock holdings snapshot.
 * Official verified endpoint: GET /beta/live/congressholdings
 * Fields: Politician, Holdings (JSON ticker→value), Type
 *
 * Values are Quiver estimates, not official FD line items.
 * Politician is a name, not BioGuideID — matched via PoliticianIndex.
 */
export async function syncCongressHoldings(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedCongressHolding>();
  let matched = 0;
  let unmatched = 0;

  try {
    const rows = await c.getJson<QuiverCongressHolding[]>(
      QUIVER_ENDPOINTS.liveCongressHoldings,
      { expectArray: true, cache: false }
    );

    const netWorth =
      readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
    const index = PoliticianIndex.fromNetWorth(netWorth);

    for (const row of rows) {
      const resolved = index.resolve({
        name: row.Politician,
        chamber: row.Type,
      });
      const n = normalizeCongressHolding(
        row,
        fetchedAt,
        resolved.bioguideId
      );
      if (!n) continue;
      if (n.bioguideId) matched += 1;
      else unmatched += 1;
      byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero congress holdings — refusing overwrite");
    }

    const list = [...byHash.values()];
    writeQuiverJson("congressHoldings", list);

    updateMeta("congress_holdings", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
      recordsMatched: matched,
      recordsUnmatched: unmatched,
    });

    const result: SyncResult = {
      dataset: "congress_holdings",
      status: "success",
      recordsFetched: rows.length,
      recordsWritten: list.length,
      recordsSkipped: 0,
      recordsMatched: matched,
      recordsUnmatched: unmatched,
      errors: [],
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    console.log(
      `[quiver] congress holdings: ${list.length} politicians (${matched} matched BioGuideID)`
    );
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "congress_holdings",
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
