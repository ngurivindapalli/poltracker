/**
 * Master Quiver sync — independent dataset steps, never wipe on failure.
 */

import { getQuiverClient } from "@/lib/quiver/client";
import type { SyncResult } from "@/lib/quiver/types";
import { syncCongressTrades } from "./congressTrades";
import { syncPoliticianNetWorth } from "./politicianNetWorth";
import { syncCorporateDonors } from "./corporateDonors";
import { syncGovernmentContracts } from "./governmentContracts";
import { syncCorporateLobbying } from "./corporateLobbying";
import { syncOffExchange } from "./offExchange";
import { syncTrumpTrades } from "./trumpTrades";

export type SyncAllOptions = {
  only?: Array<
    | "trades"
    | "networth"
    | "donors"
    | "contracts"
    | "lobbying"
    | "offexchange"
    | "trump"
  >;
};

export async function syncQuiverData(
  opts: SyncAllOptions = {}
): Promise<Record<string, SyncResult>> {
  const client = getQuiverClient();
  const only = new Set(opts.only ?? []);
  const run = (key: string) => only.size === 0 || only.has(key as never);

  const results: Record<string, SyncResult> = {};

  if (run("trades")) {
    console.log("=== 1/7 Congress Trading ===");
    results.congress_trades = await syncCongressTrades(client);
  }
  if (run("networth")) {
    console.log("=== 2/7 Politician Net Worth ===");
    results.politician_net_worth = await syncPoliticianNetWorth(client);
  }
  if (run("donors")) {
    console.log("=== 3/7 Corporate Donors ===");
    results.corporate_donors = await syncCorporateDonors(client);
  }
  if (run("contracts")) {
    console.log("=== 4/7 Government Contracts ===");
    results.government_contracts = await syncGovernmentContracts(client);
  }
  if (run("lobbying")) {
    console.log("=== 5/7 Corporate Lobbying ===");
    results.corporate_lobbying = await syncCorporateLobbying(client);
  }
  if (run("offexchange")) {
    console.log("=== 6/7 Off-Exchange Trading ===");
    results.off_exchange = await syncOffExchange(client);
  }
  if (run("trump")) {
    console.log("=== 7/7 Trump Stock Trades ===");
    results.trump_trades = await syncTrumpTrades(client);
  }

  return results;
}
