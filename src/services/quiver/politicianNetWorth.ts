import { getQuiverClient, QuiverClient } from "@/lib/quiver/client";
import { QUIVER_ENDPOINTS } from "@/lib/quiver/endpoints";
import { appendSyncLog, updateMeta, writeQuiverJson } from "@/lib/quiver/cache";
import { normalizePolitician } from "@/lib/quiver/normalizers";
import type {
  NormalizedNetWorth,
  QuiverPolitician,
  SyncResult,
} from "@/lib/quiver/types";
import { getPrismaOptional } from "@/lib/quiver/prisma";

/**
 * Fetch BOTH house and senate politician pages, then full pagination fallback.
 * BioGuideID is required for storage (name-only discarded).
 */
export async function syncPoliticianNetWorth(
  client?: QuiverClient
): Promise<SyncResult> {
  const c = client ?? getQuiverClient();
  const startedAt = new Date().toISOString();
  const fetchedAt = startedAt;
  const byBio = new Map<string, NormalizedNetWorth>();
  const errors: string[] = [];

  try {
    // Single full pagination (chamber filters still include candidates inconsistently).
    // Cap pages to respect rate limits; default 15 (~7.5k rows).
    const maxPages = Number(process.env.QUIVER_NETWORTH_MAX_PAGES || 15);
    try {
      const rows = await c.getPaginatedData<QuiverPolitician>(
        QUIVER_ENDPOINTS.bulkPoliticians,
        {
          pageSize: 500,
          maxPages,
        }
      );
      for (const row of rows) {
        const n = normalizePolitician(row, fetchedAt);
        if (!n) continue;
        // Keep House/Senate over Candidate when both appear (shouldn't)
        const prev = byBio.get(n.bioguideId);
        if (
          !prev ||
          (n.netWorth != null && prev.netWorth == null) ||
          (n.tradeCount != null &&
            (prev.tradeCount == null || n.tradeCount > prev.tradeCount)) ||
          ((n.chamber || "").toLowerCase() !== "candidate" &&
            (prev.chamber || "").toLowerCase() === "candidate")
        ) {
          byBio.set(n.bioguideId, n);
        }
      }
    } catch (e) {
      errors.push(`politicians: ${(e as Error).message}`);
    }

    if (byBio.size === 0) {
      throw new Error("No politicians with BioGuideID — refusing overwrite");
    }

    const list = [...byBio.values()];
    writeQuiverJson("politicianNetWorth", list);

    // Also refresh networth.json display format
    const fs = await import("fs");
    const path = await import("path");
    const display = list
      .filter((p) => p.netWorth != null)
      .map((p) => ({
        bioguideId: p.bioguideId,
        name: p.name,
        netWorth: `$${Math.round(p.netWorth!).toLocaleString()}`,
        tradeCount: p.tradeCount,
        tradeVolume: p.tradeVolume,
        chamber: p.chamber,
        party: p.party,
        state: p.state,
        imageUrl: p.imageUrl,
        source: "quiver",
        fetchedAt,
      }));
    for (const rel of [
      path.join(process.cwd(), "src", "data", "networth.json"),
      path.join(process.cwd(), "data", "networth.json"),
    ]) {
      fs.mkdirSync(path.dirname(rel), { recursive: true });
      fs.writeFileSync(rel, JSON.stringify(display, null, 2));
    }

    const prisma = await getPrismaOptional();
    let written = 0;
    if (prisma) {
      for (const r of list) {
        try {
          // Ensure member exists when possible
          const existing = await prisma.member.findUnique({
            where: { bioguideId: r.bioguideId },
          });
          if (!existing) {
            const parts = r.name.trim().split(/\s+/);
            const firstName = parts[0] || r.name;
            const lastName = parts.slice(1).join(" ") || r.name;
            const chamber =
              (r.chamber || "").toLowerCase().includes("sen")
                ? "senate"
                : "house";
            await prisma.member.create({
              data: {
                bioguideId: r.bioguideId,
                firstName,
                lastName,
                chamber,
                party: r.party,
                state: (r.state || "XX").slice(0, 24),
                active: true,
              },
            });
          }

          await prisma.politicianNetWorth.upsert({
            where: { bioguideId: r.bioguideId },
            create: {
              bioguideId: r.bioguideId,
              name: r.name,
              party: r.party,
              chamber: r.chamber,
              state: r.state,
              imageUrl: r.imageUrl,
              tradeCount: r.tradeCount,
              tradeVolume: r.tradeVolume,
              netWorth: r.netWorth,
              source: "quiver",
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
            update: {
              name: r.name,
              party: r.party,
              chamber: r.chamber,
              state: r.state,
              imageUrl: r.imageUrl,
              tradeCount: r.tradeCount,
              tradeVolume: r.tradeVolume,
              netWorth: r.netWorth,
              fetchedAt: new Date(fetchedAt),
              active: true,
            },
          });
          written += 1;
        } catch (e) {
          errors.push(`${r.bioguideId}: ${(e as Error).message}`);
        }
      }
    }

    updateMeta("politician_net_worth", {
      lastUpdated: fetchedAt,
      recordCount: list.length,
      status: errors.length ? "partial" : "success",
    });

    const result: SyncResult = {
      dataset: "politician_net_worth",
      status: errors.length ? "partial" : "success",
      recordsFetched: list.length,
      recordsWritten: prisma ? written : list.length,
      recordsSkipped: 0,
      errors: errors.slice(0, 50),
      startedAt,
      completedAt: new Date().toISOString(),
    };
    appendSyncLog(result);
    return result;
  } catch (e) {
    const result: SyncResult = {
      dataset: "politician_net_worth",
      status: "failed",
      recordsFetched: byBio.size,
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
