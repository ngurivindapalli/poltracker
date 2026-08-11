/**
 * Validate Quiver cache integrity after sync (no live API calls).
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  QUIVER_CACHE_DIR,
  QUIVER_CACHE_FILES,
  readQuiverJson,
} from "../src/lib/quiver/cache";

function assert(cond: unknown, msg: string) {
  if (!cond) throw new Error(msg);
}

function checkUnique(arr: any[], key: string, label: string) {
  const set = new Set<string>();
  let dupes = 0;
  for (const row of arr) {
    const k = String(row[key] ?? "");
    if (!k) continue;
    if (set.has(k)) dupes += 1;
    set.add(k);
  }
  assert(dupes === 0, `${label}: ${dupes} duplicate ${key} values`);
  console.log(`✓ ${label}: ${arr.length} rows, unique ${key}`);
}

function checkDates(arr: any[], fields: string[], label: string) {
  let bad = 0;
  for (const row of arr) {
    for (const f of fields) {
      const v = row[f];
      if (v == null || v === "") continue;
      if (!/^\d{4}-\d{2}-\d{2}/.test(String(v))) bad += 1;
    }
  }
  assert(bad === 0, `${label}: ${bad} invalid dates`);
}

async function main() {
  console.log("Validating Quiver cache at", QUIVER_CACHE_DIR);

  for (const file of Object.values(QUIVER_CACHE_FILES)) {
    const p = path.join(QUIVER_CACHE_DIR, file);
    if (!fs.existsSync(p) && file !== "sync-log.json") {
      console.warn(`! missing ${file} (run npm run sync:quiver)`);
    }
  }

  const trades = readQuiverJson<any[]>("congressTrades") ?? [];
  if (trades.length) {
    checkUnique(trades, "sourceHash", "congress_trades");
    checkDates(trades, ["transactionDate", "reportDate"], "congress_trades");
    const bios = trades.filter((t) => t.bioguideId).length;
    console.log(`  bioguide-linked trades: ${bios}/${trades.length}`);
  }

  const nw = readQuiverJson<any[]>("politicianNetWorth") ?? [];
  if (nw.length) {
    checkUnique(nw, "bioguideId", "politician_net_worth");
  }

  const donors = readQuiverJson<any[]>("corporateDonors") ?? [];
  if (donors.length) checkUnique(donors, "sourceHash", "corporate_donors");

  const contracts = readQuiverJson<any[]>("governmentContracts") ?? [];
  if (contracts.length) {
    checkUnique(contracts, "sourceHash", "government_contracts");
    checkDates(contracts, ["awardDate", "actionDate"], "government_contracts");
  }

  const lobbying = readQuiverJson<any[]>("corporateLobbying") ?? [];
  if (lobbying.length) checkUnique(lobbying, "sourceHash", "corporate_lobbying");

  const off = readQuiverJson<any[]>("offExchange") ?? [];
  if (off.length) checkUnique(off, "sourceHash", "off_exchange");

  const trump = readQuiverJson<any[]>("trumpTrades") ?? [];
  if (trump.length) {
    checkUnique(trump, "sourceHash", "trump_trades");
    checkDates(trump, ["transactionDate", "reportDate"], "trump_trades");
  }

  console.log("Validation complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
