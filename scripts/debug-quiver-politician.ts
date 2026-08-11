/**
 * Diagnose politician trade coverage after sync (BioGuideID).
 * Usage: npm run debug:quiver:politician -- B001230
 *
 * Primary truth: Postgres when available; warehouse JSON otherwise.
 */
import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config();

import {
  getDatasetLastUpdated,
  getDatasetMeta,
  isCongressTradesSyncComplete,
  readQuiverJson,
} from "../src/lib/quiver/cache";
import type {
  NormalizedCongressTrade,
  NormalizedNetWorth,
} from "../src/lib/quiver/types";
import { PoliticianIndex, coreNameKey } from "../src/lib/quiver/identity";
import { getPrismaOptional } from "../src/lib/quiver/prisma";
import {
  getNetWorthForMember,
  getTradesForMember,
} from "../src/lib/profileFinancials";

async function main() {
  const bioguideId = (process.argv[2] || "").toUpperCase().trim();
  if (!bioguideId) {
    console.error("Usage: npm run debug:quiver:politician -- B001230");
    process.exit(1);
  }

  const politicians =
    readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
  const warehouseTrades =
    readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
  const index = PoliticianIndex.fromNetWorth(politicians);
  const pol =
    index.get(bioguideId) ||
    politicians.find((p) => p.bioguideId === bioguideId);
  const appNw = await getNetWorthForMember(bioguideId);
  const politicianName = pol?.name || appNw?.name || "(unknown)";

  // Database
  let dbCount = 0;
  let dbEarliest: string | null = null;
  let dbLatest: string | null = null;
  try {
    const prisma = await getPrismaOptional();
    if (prisma) {
      dbCount = await prisma.congressTrade.count({
        where: { bioguideId, active: true },
      });
      if (dbCount > 0) {
        const earliest = await prisma.congressTrade.findFirst({
          where: { bioguideId, active: true, transactionDate: { not: null } },
          orderBy: { transactionDate: "asc" },
          select: { transactionDate: true },
        });
        const latest = await prisma.congressTrade.findFirst({
          where: { bioguideId, active: true, transactionDate: { not: null } },
          orderBy: { transactionDate: "desc" },
          select: { transactionDate: true },
        });
        dbEarliest = earliest?.transactionDate
          ? earliest.transactionDate.toISOString().slice(0, 10)
          : null;
        dbLatest = latest?.transactionDate
          ? latest.transactionDate.toISOString().slice(0, 10)
          : null;
      }
    }
  } catch (e) {
    console.warn("DB query failed:", (e as Error).message);
  }

  const jsonMatched = warehouseTrades.filter(
    (t) => (t.bioguideId || "").toUpperCase() === bioguideId
  );
  const jsonDates = jsonMatched
    .map((t) => t.transactionDate)
    .filter((d): d is string => Boolean(d))
    .sort();

  const nameKeys = new Set(
    [politicianName, pol?.name, appNw?.name]
      .filter(Boolean)
      .map((n) => coreNameKey(String(n)))
  );
  const rawMatchingNames = [
    ...new Set(
      warehouseTrades
        .filter((t) => nameKeys.has(coreNameKey(t.politicianName)))
        .map((t) => t.politicianName)
    ),
  ];

  const unmatchedLog = readQuiverJson<{
    count?: number;
    samples?: Array<{ name: string }>;
  }>("unmatchedTrades");
  const unmatchedByName =
    unmatchedLog?.samples?.filter((s) =>
      nameKeys.has(coreNameKey(s.name || ""))
    ).length ?? 0;

  const appTrades = await getTradesForMember(bioguideId, 5000);
  const tradesMeta = getDatasetMeta("congress_trades");

  console.log("\n========================================");
  console.log("Quiver Politician Debug");
  console.log("========================================");
  console.log("BioGuideID:");
  console.log(bioguideId);
  console.log("\nPolitician:");
  console.log(politicianName);
  console.log("\nChamber / State / Party:");
  console.log(
    [
      pol?.chamber || appNw?.chamber || "—",
      pol?.state || appNw?.state || "—",
      pol?.party || appNw?.party || "—",
    ].join(" / ")
  );
  console.log("\nDatabase trades:");
  console.log(dbCount);
  console.log("\nEarliest trade:");
  console.log(dbEarliest || jsonDates[0] || "—");
  console.log("\nLatest trade:");
  console.log(dbLatest || jsonDates[jsonDates.length - 1] || "—");
  console.log("\nQuiver records matched (warehouse by BioGuideID):");
  console.log(jsonMatched.length);
  console.log("\nApp loader trades:");
  console.log(appTrades.length);
  console.log("\nUnmatched records (name samples for this politician):");
  console.log(unmatchedByName);
  console.log("\nRaw matching names:");
  console.log(rawMatchingNames.length ? rawMatchingNames.join(", ") : "(none)");
  console.log("\nPoliticians endpoint TradeCount / TradeVolume:");
  console.log(
    `${appNw?.tradeCount ?? pol?.tradeCount ?? "—"} / ${
      appNw?.tradeVolume ?? pol?.tradeVolume ?? "—"
    }`
  );
  console.log("\nNet worth:");
  console.log(appNw?.netWorth ?? pol?.netWorth ?? "—");
  console.log("\nSync meta (congress_trades):");
  console.log(
    JSON.stringify(
      {
        status: tradesMeta?.status ?? null,
        complete: isCongressTradesSyncComplete(),
        recordCount: tradesMeta?.recordCount ?? null,
        lastUpdated: tradesMeta?.lastUpdated ?? getDatasetLastUpdated("congress_trades"),
        coverageStart: tradesMeta?.coverageStart ?? null,
        coverageEnd: tradesMeta?.coverageEnd ?? null,
        warehouseRows: warehouseTrades.length,
      },
      null,
      2
    )
  );

  if (jsonMatched.length) {
    console.log("\nSample matched trades:");
    for (const t of jsonMatched.slice(0, 10)) {
      console.log(
        `  ${t.transactionDate || "?"}  ${t.ticker || "?"}  ${t.transaction}  ${
          t.amountRange || t.amount || ""
        }`
      );
    }
  } else if (isCongressTradesSyncComplete()) {
    console.log(
      "\nNote: full Quiver bulk history is synchronized; this BioGuideID has 0 trades in the Quiver dataset."
    );
  } else {
    console.log(
      "\nNote: trade sync is incomplete — empty result may not be definitive."
    );
  }
  console.log("========================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
