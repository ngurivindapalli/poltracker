/**
 * Diagnose Quiver politician mapping by BioGuideID.
 * Usage: npm run debug:quiver:politician -- B001288
 */
import "dotenv/config";
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });
config();

import {
  getDatasetLastUpdated,
  readQuiverJson,
} from "../src/lib/quiver/cache";
import type {
  NormalizedCongressTrade,
  NormalizedNetWorth,
} from "../src/lib/quiver/types";
import { PoliticianIndex, coreNameKey } from "../src/lib/quiver/identity";
import {
  getNetWorthForMember,
  getTradesForMember,
} from "../src/lib/profileFinancials";

async function main() {
  const bioguideId = (process.argv[2] || "").toUpperCase().trim();
  if (!bioguideId) {
    console.error("Usage: npm run debug:quiver:politician -- B001288");
    process.exit(1);
  }

  const politicians =
    readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
  const trades = readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
  const index = PoliticianIndex.fromNetWorth(politicians);
  const pol = index.get(bioguideId) || politicians.find((p) => p.bioguideId === bioguideId);

  const matchedTrades = trades.filter(
    (t) => (t.bioguideId || "").toUpperCase() === bioguideId
  );
  const unmatchedForName = pol
    ? trades.filter(
        (t) =>
          !t.bioguideId &&
          coreNameKey(t.politicianName) === coreNameKey(pol.name)
      )
    : [];

  // loader path (same as app)
  const appTrades = await getTradesForMember(bioguideId, 5000);
  const appNw = await getNetWorthForMember(bioguideId);

  console.log("\n========================================");
  console.log("Quiver Politician Debug");
  console.log("========================================");
  console.log("Politician:");
  console.log(pol?.name || appNw?.name || "(not found in cache)");
  console.log("\nBioGuideID:");
  console.log(bioguideId);
  console.log("\nChamber:");
  console.log(pol?.chamber || appNw?.chamber || "—");
  console.log("\nState:");
  console.log(pol?.state || appNw?.state || "—");
  console.log("\nParty:");
  console.log(pol?.party || appNw?.party || "—");
  console.log("\nQuiver net worth:");
  console.log(
    appNw?.netWorth != null
      ? appNw.netWorth
      : pol?.netWorth != null
        ? pol.netWorth
        : "(null / missing)"
  );
  console.log("\nTrade count (politicians endpoint):");
  console.log(appNw?.tradeCount ?? pol?.tradeCount ?? "—");
  console.log("\nTrade volume (politicians endpoint):");
  console.log(appNw?.tradeVolume ?? pol?.tradeVolume ?? "—");
  console.log("\nMatched trades (cache by BioGuideID):");
  console.log(matchedTrades.length);
  console.log("\nMatched trades (app loader):");
  console.log(appTrades.length);
  console.log("\nUnmatched trades (same core name, null BioGuide):");
  console.log(unmatchedForName.length);
  console.log("\nCache last updated (trades / networth):");
  console.log(
    getDatasetLastUpdated("congress_trades"),
    "/",
    getDatasetLastUpdated("politician_net_worth")
  );

  if (matchedTrades.length) {
    console.log("\nSample matched trades:");
    for (const t of matchedTrades.slice(0, 10)) {
      console.log(
        `  ${t.transactionDate || "?"}  ${t.ticker || "?"}  ${t.transaction}  ${
          t.amountRange || t.amount || ""
        }`
      );
    }
  }

  if (!pol && !appNw) {
    console.log(
      "\nNOTE: politician missing from cache. Run: npm run sync:quiver:networth"
    );
  }
  if ((appNw?.tradeCount || 0) > 0 && appTrades.length === 0) {
    console.log(
      "\nWARNING: politicians endpoint reports trades but cache has 0 for this BioGuideID."
    );
    console.log("Run a FULL history sync: npm run sync:quiver:trades");
    console.log(
      "(Older trades are deep in /bulk/congresstrading pagination.)"
    );
  }
  console.log("========================================\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
