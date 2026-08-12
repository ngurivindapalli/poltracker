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
import { rebuildSenatorSummaries } from "./senatorSummaries";

export type SyncAllOptions = {
  only?: Array<
    | "trades"
    | "networth"
    | "donors"
    | "contracts"
    | "lobbying"
    | "offexchange"
    | "trump"
    | "summaries"
  >;
};

export async function syncQuiverData(
  opts: SyncAllOptions = {}
): Promise<Record<string, SyncResult>> {
  const only = new Set(opts.only ?? []);
  const run = (key: string) => only.size === 0 || only.has(key as never);

  const needsClient =
    run("trades") ||
    run("networth") ||
    run("donors") ||
    run("contracts") ||
    run("lobbying") ||
    run("offexchange") ||
    run("trump");

  const client = needsClient ? getQuiverClient() : null;
  const results: Record<string, SyncResult> = {};

  if (run("trades") && client) {
    console.log("=== 1/8 Congress Trading ===");
    results.congress_trades = await syncCongressTrades(client);
  }
  if (run("networth") && client) {
    console.log("=== 2/8 Politician Net Worth ===");
    results.politician_net_worth = await syncPoliticianNetWorth(client);
  }
  if (run("donors") && client) {
    console.log("=== 3/8 Corporate Donors ===");
    results.corporate_donors = await syncCorporateDonors(client);
  }
  if (run("contracts") && client) {
    console.log("=== 4/8 Government Contracts ===");
    results.government_contracts = await syncGovernmentContracts(client);
  }
  if (run("lobbying") && client) {
    console.log("=== 5/8 Corporate Lobbying ===");
    results.corporate_lobbying = await syncCorporateLobbying(client);
  }
  if (run("offexchange") && client) {
    console.log("=== 6/8 Off-Exchange Trading ===");
    results.off_exchange = await syncOffExchange(client);
  }
  if (run("trump") && client) {
    console.log("=== 7/8 Trump Stock Trades ===");
    results.trump_trades = await syncTrumpTrades(client);
  }

  // Always refresh listing summaries after financial datasets (or when requested alone)
  const needSummaries =
    only.size === 0 ||
    run("summaries") ||
    run("trades") ||
    run("networth");
  if (needSummaries) {
    console.log("=== 8/8 Senator summaries (precompute) ===");
    results.senator_summaries = await rebuildSenatorSummaries();
  }

  return results;
}
