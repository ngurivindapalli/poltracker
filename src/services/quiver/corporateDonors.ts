import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizeDonor } from "@/lib/quiver/normalizers";
import type {
  NormalizedDonor,
  QuiverCorporateDonor,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

export async function syncCorporateDonors(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byHash = new Map<string, NormalizedDonor>();
  const errors: string[] = [];

  try {
    const rows = await c.getPaginatedData<QuiverCorporateDonor>(
      QUIVER_ENDPOINTS.bulkCorporateDonors,
      {
        pageSize: 500,
        maxPages: Number(process.env.QUIVER_DONORS_MAX_PAGES || 50),
      }
    );

    for (const row of rows) {
      const n = normalizeDonor(row, fetchedAt);
      if (n) byHash.set(n.sourceHash, n);
    }

    if (byHash.size === 0) {
      throw new Error("Zero corporate donors — refusing overwrite");
    }

    const list = [...byHash.values()];
    writeQuiverJson("corporateDonors", list);

    // public mirror for simple clients
    const fs = await import("fs");
    const path = await import("path");
    const pub = path.join(process.cwd(), "public", "data", "quiver-donors.json");
    fs.mkdirSync(path.dirname(pub), { recursive: true });
    fs.writeFileSync(pub, JSON.stringify(list));

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          await prisma.corporateDonor.upsert({
            where: { sourceHash: r.sourceHash },
            create: {
              sourceHash: r.sourceHash,
              bioguideId: r.bioguideId,
              candidateName: r.candidateName,
              companyCommitteeName: r.companyCommitteeName,
              transactionDate: r.transactionDate
                ? new Date(r.transactionDate)
                : null,
              transactionAmount: r.transactionAmount,
              ticker: r.ticker,
              committeeName: r.committeeName,
              cycle: r.cycle,
              transactionType: r.transactionType,
              companyCommitteeId: r.companyCommitteeId,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              transactionAmount: r.transactionAmount,
              cycle: r.cycle,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
          });
          written += 1;
        } catch {
          /* skip FK misses */
        }
      }
    }

    updateMeta("corporate_donors", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: "success",
    });

    const result: SyncResult = {
      dataset: "corporate_donors",
      status: "success",
      recordsFetched: list.length,
      recordsWritten: prisma ? written : list.length,
      recordsSkipped: 0,
      errors,
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "corporate_donors",
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
