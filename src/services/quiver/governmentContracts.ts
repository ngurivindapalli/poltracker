import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizeContract } from "@/lib/quiver/normalizers";
import type {
  NormalizedContract,
  QuiverGovContract,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

/**
 * Government contracts are company/ticker scoped — NOT politician portfolio linked.
 */
export async function syncGovernmentContracts(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedContract>();

  try {
    const live = await c.getJson<QuiverGovContract[]>(
      QUIVER_ENDPOINTS.liveGovContractsAll,
      { expectArray: true, cache: false }
    );
    for (const row of live) {
      const n = normalizeContract(row, fetchedAt);
      if (n) byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero contracts — refusing overwrite");
    }

    const list = [...byHash.values()];
    writeQuiverJson("governmentContracts", list);

    const fs = await import("fs");
    const path = await import("path");
    // Replace legacy contracts-recent.json so old route fallbacks also get Quiver
    const pub = path.join(process.cwd(), "public", "data", "contracts-recent.json");
    fs.writeFileSync(
      pub,
      JSON.stringify(
        list.map((c) => ({
          ticker: c.ticker,
          vendor: c.vendor,
          agency: c.agency,
          awardDate: c.awardDate,
          actionDate: c.actionDate,
          description: c.description,
          amount: c.amount,
          status: c.status,
          source: "quiver",
        }))
      )
    );

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          await prisma.governmentContract.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              ticker: r.ticker,
              vendor: r.vendor,
              agency: r.agency,
              awardDate: r.awardDate ? new Date(r.awardDate) : null,
              actionDate: r.actionDate ? new Date(r.actionDate) : null,
              description: r.description,
              amount: r.amount,
              status: r.status,
              source: "quiver",
              fingerprint: r.sourceHash,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              amount: r.amount,
              description: r.description,
              agency: r.agency,
              fetchedAt: new Date(fetchedAt),
              source: "quiver",
              active: true,
            },
          });
          written += 1;
        } catch {
          /* skip */
        }
      }
    }

    updateMeta("government_contracts", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
    });

    const result: SyncResult = {
      dataset: "government_contracts",
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
      dataset: "government_contracts",
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
