/**
 * Quiver-backed financial loaders.
 * Prefers Postgres congress_trades when available; otherwise warehouse JSON.
 * Frontend never calls Quiver directly.
 */

import { buySellSide } from "@/lib/quiver/normalizers";
import {
  getDatasetLastUpdated,
  getDatasetMeta,
  isCongressTradesSyncComplete,
  readQuiverJson,
} from "@/lib/quiver/cache";
import { getPrismaOptional } from "@/lib/quiver/prisma";
import type {
  NormalizedCongressTrade,
  NormalizedContract,
  NormalizedDonor,
  NormalizedLobbying,
  NormalizedNetWorth,
  NormalizedOffExchange,
  NormalizedTrumpTrade,
  QuiverMeta,
} from "@/lib/quiver/types";

export type TradeRow = {
  id?: string;
  bioguideId: string | null;
  ticker: string | null;
  asset: string;
  assetType: string | null;
  txType: string;
  buySell: string | null;
  amountLow: number | null;
  amountHigh: number | null;
  amountLabel?: string | null;
  tradeDate: string | null;
  filingDate: string | null;
  owner: string | null;
  comment: string | null;
  source: string | null;
  party?: string | null;
  chamber?: string | null;
  excessReturn?: number | null;
  priceChange?: number | null;
  spyChange?: number | null;
};

export type ContractRow = {
  id?: string;
  ticker: string;
  vendor: string;
  agency: string | null;
  awardDate: string | null;
  actionDate?: string | null;
  description: string | null;
  amount: number | null;
  status: string | null;
  source?: string | null;
};

export type DisclosureRow = {
  id: string;
  year: number;
  filingType: string;
  sourceUrl: string;
  assets: Array<{
    description: string;
    valueLow: number | null;
    valueHigh: number | null;
    incomeType: string | null;
  }>;
};

export type DonorRow = {
  company: string | null;
  pac: string | null;
  amount: number | null;
  date: string | null;
  cycle: number | null;
  ticker: string | null;
  transactionType: string | null;
  source: string;
};

function tradesAll(): NormalizedCongressTrade[] {
  return readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
}

function netWorthAll(): NormalizedNetWorth[] {
  return readQuiverJson<NormalizedNetWorth[]>("politicianNetWorth") ?? [];
}

function donorsAll(): NormalizedDonor[] {
  return readQuiverJson<NormalizedDonor[]>("corporateDonors") ?? [];
}

function contractsAll(): NormalizedContract[] {
  return readQuiverJson<NormalizedContract[]>("governmentContracts") ?? [];
}

function lobbyingAll(): NormalizedLobbying[] {
  return readQuiverJson<NormalizedLobbying[]>("corporateLobbying") ?? [];
}

function offExchangeAll(): NormalizedOffExchange[] {
  return readQuiverJson<NormalizedOffExchange[]>("offExchange") ?? [];
}

function trumpAll(): NormalizedTrumpTrade[] {
  return readQuiverJson<NormalizedTrumpTrade[]>("trumpTrades") ?? [];
}

export function getQuiverSourceMeta() {
  const meta = readQuiverJson<QuiverMeta>("meta");
  const trades = meta?.datasets?.congress_trades;
  return {
    source: "Quiver Quantitative" as const,
    meta,
    lastUpdated:
      trades?.lastUpdated ||
      meta?.datasets?.politician_net_worth?.lastUpdated ||
      null,
    tradesSyncStatus: trades?.status ?? null,
    tradesSyncComplete: isCongressTradesSyncComplete(),
    tradesRecordCount: trades?.recordCount ?? null,
    tradesCoverageStart: trades?.coverageStart ?? null,
    tradesCoverageEnd: trades?.coverageEnd ?? null,
  };
}

function mapNormalizedTrade(t: NormalizedCongressTrade): TradeRow {
  return {
    id: t.sourceHash,
    bioguideId: t.bioguideId,
    ticker: t.ticker,
    asset: t.companyName || t.ticker || "",
    assetType: t.tickerType,
    txType: t.transaction,
    buySell: buySellSide(t.transaction),
    amountLow: null,
    amountHigh: null,
    amountLabel: t.amountRange || t.amount,
    tradeDate: t.transactionDate,
    filingDate: t.reportDate,
    owner: t.owner,
    comment: t.description,
    source: "quiver",
    party: t.party,
    chamber: t.chamber,
    excessReturn: t.excessReturn,
    priceChange: t.priceChange,
    spyChange: t.spyChange,
  };
}

export async function getTradesForMember(
  bioguideId: string,
  limit = 100
): Promise<TradeRow[]> {
  const bid = bioguideId.toUpperCase();
  const take = Math.max(1, Math.min(limit || 100, 5000));

  try {
    const prisma = await getPrismaOptional();
    if (prisma) {
      const rows = await prisma.congressTrade.findMany({
        where: { bioguideId: bid, active: true },
        orderBy: [{ transactionDate: "desc" }, { reportDate: "desc" }],
        take,
      });
      if (rows.length > 0) {
        return rows.map((r) => ({
          id: r.sourceHash,
          bioguideId: r.bioguideId,
          ticker: r.ticker,
          asset: r.companyName || r.ticker || "",
          assetType: r.tickerType,
          txType: r.transaction,
          buySell: buySellSide(r.transaction),
          amountLow: null,
          amountHigh: null,
          amountLabel: r.amountRange || r.amount,
          tradeDate: r.transactionDate
            ? new Date(r.transactionDate).toISOString().slice(0, 10)
            : null,
          filingDate: r.reportDate
            ? new Date(r.reportDate).toISOString().slice(0, 10)
            : null,
          owner: r.owner,
          comment: r.description,
          source: r.source || "quiver",
          party: r.party,
          chamber: r.chamber,
          excessReturn: r.excessReturn,
          priceChange: r.priceChange,
          spyChange: r.spyChange,
        }));
      }
      // Only treat empty DB as definitive when warehouse is large.
      const total = await prisma.congressTrade.count();
      if (total >= 50_000) return [];
    }
  } catch (e) {
    console.warn(
      "[profileFinancials] DB trade read failed, JSON fallback:",
      (e as Error).message
    );
  }

  return tradesAll()
    .filter((t) => (t.bioguideId || "").toUpperCase() === bid)
    .sort((a, b) =>
      String(b.transactionDate || "").localeCompare(
        String(a.transactionDate || "")
      )
    )
    .slice(0, take)
    .map(mapNormalizedTrade);
}

/**
 * Frequently traded tickers from congressional trades (activity), NOT holdings.
 * Quiver's Disclosed Holdings / Estimated Live Portfolio are separate products and
 * are not available as Hobbyist array endpoints for holdings lines.
 */
export async function getMostTradedTickers(
  bioguideId: string,
  limit = 10
): Promise<
  Array<{ ticker: string; tradeCount: number; lastTradeDate: string | null }>
> {
  const trades = await getTradesForMember(bioguideId, 5000);
  const counts = new Map<
    string,
    { tradeCount: number; lastTradeDate: string | null }
  >();
  for (const t of trades) {
    if (!t.ticker) continue;
    const key = t.ticker.toUpperCase();
    const prev = counts.get(key) || { tradeCount: 0, lastTradeDate: null };
    prev.tradeCount += 1;
    if (
      t.tradeDate &&
      (!prev.lastTradeDate || t.tradeDate > prev.lastTradeDate)
    ) {
      prev.lastTradeDate = t.tradeDate;
    }
    counts.set(key, prev);
  }
  return [...counts.entries()]
    .map(([ticker, v]) => ({ ticker, ...v }))
    .sort((a, b) => b.tradeCount - a.tradeCount)
    .slice(0, limit);
}

/** @deprecated Alias kept for call sites; does not represent disclosed holdings. */
export async function getLargestHoldings(
  bioguideId: string,
  limit = 10
): Promise<
  Array<{ ticker: string; tradeCount: number; lastTradeDate: string | null }>
> {
  return getMostTradedTickers(bioguideId, limit);
}

/**
 * Quiver Hobbyist API does not expose annual FD disclosed holding lines or
 * "Estimated Live Stock Portfolio" series. Return empty — UI must not fabricate.
 */
export async function getDisclosedHoldingsAvailability(_bioguideId: string) {
  return {
    available: false as const,
    reason:
      "Quiver Quantitative Hobbyist endpoints do not provide disclosed holdings line items or estimated live stock portfolio positions. Net worth and congressional trades are available via /bulk/congress/politicians and /bulk/congresstrading.",
    disclosedHoldings: [] as [],
    estimatedLivePortfolio: [] as [],
  };
}

/**
 * Contracts by company ticker. Optional filter to tickers a member has traded
 * for profile context — data itself is still company-scoped, not a politician FK.
 */
export async function getContractsForMember(
  bioguideId: string,
  limit = 50
): Promise<ContractRow[]> {
  const traded = await getTradesForMember(bioguideId, 5000);
  const tickers = new Set(
    traded.map((t) => (t.ticker || "").toUpperCase()).filter(Boolean)
  );
  const all = contractsAll();
  const filtered =
    tickers.size > 0
      ? all.filter((c) => tickers.has((c.ticker || "").toUpperCase()))
      : [];
  return filtered
    .sort((a, b) =>
      String(b.awardDate || "").localeCompare(String(a.awardDate || ""))
    )
    .slice(0, limit)
    .map((c) => ({
      id: c.sourceHash,
      ticker: c.ticker,
      vendor: c.vendor || c.ticker,
      agency: c.agency,
      awardDate: c.awardDate,
      actionDate: c.actionDate,
      description: c.description,
      amount: c.amount,
      status: c.status,
      source: "quiver",
    }));
}

export async function getContractsByTicker(
  ticker: string,
  limit = 50
): Promise<ContractRow[]> {
  const t = ticker.toUpperCase();
  return contractsAll()
    .filter((c) => (c.ticker || "").toUpperCase() === t)
    .sort((a, b) =>
      String(b.awardDate || "").localeCompare(String(a.awardDate || ""))
    )
    .slice(0, limit)
    .map((c) => ({
      id: c.sourceHash,
      ticker: c.ticker,
      vendor: c.vendor || c.ticker,
      agency: c.agency,
      awardDate: c.awardDate,
      actionDate: c.actionDate,
      description: c.description,
      amount: c.amount,
      status: c.status,
      source: "quiver",
    }));
}

export async function getDonorsForMember(
  bioguideId: string,
  limit = 50
): Promise<DonorRow[]> {
  const bid = bioguideId.toUpperCase();
  return donorsAll()
    .filter((d) => (d.bioguideId || "").toUpperCase() === bid)
    .sort(
      (a, b) =>
        Math.abs(b.transactionAmount || 0) - Math.abs(a.transactionAmount || 0)
    )
    .slice(0, limit)
    .map((d) => ({
      company: d.companyCommitteeName,
      pac: d.committeeName,
      amount: d.transactionAmount,
      date: d.transactionDate,
      cycle: d.cycle,
      ticker: d.ticker,
      transactionType: d.transactionType,
      source: "quiver",
    }));
}

export async function getLobbyingForTickers(
  tickers: string[],
  limit = 50
): Promise<NormalizedLobbying[]> {
  const set = new Set(tickers.map((t) => t.toUpperCase()));
  return lobbyingAll()
    .filter((r) => r.ticker && set.has(r.ticker.toUpperCase()))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, limit);
}

export async function getOffExchangeForTickers(
  tickers: string[],
  limit = 50
): Promise<NormalizedOffExchange[]> {
  const set = new Set(tickers.map((t) => t.toUpperCase()));
  return offExchangeAll()
    .filter((r) => set.has(r.ticker.toUpperCase()))
    .sort((a, b) => String(b.date || "").localeCompare(String(a.date || "")))
    .slice(0, limit);
}

export async function getTrumpTrades(limit = 100): Promise<NormalizedTrumpTrade[]> {
  return trumpAll().slice(0, limit);
}

export async function getNetWorthForMember(bioguideId: string) {
  const bid = bioguideId.toUpperCase();
  return (
    netWorthAll().find((p) => p.bioguideId.toUpperCase() === bid) ?? null
  );
}

export async function getDisclosuresForMember(
  _bioguideId: string,
  _limit = 10
): Promise<DisclosureRow[]> {
  // Do not fabricate annual disclosure holdings from trades.
  // Quiver Hobbyist SoT for portfolio position lines is not available.
  return [];
}

export async function getPortfolioSnapshot(bioguideId: string) {
  const nw = await getNetWorthForMember(bioguideId);
  const trades = await getTradesForMember(bioguideId, 5000);
  const mostTraded = await getMostTradedTickers(bioguideId, 10);
  const dates = trades
    .map((t) => t.tradeDate)
    .filter(Boolean)
    .sort() as string[];

  return {
    estimatedPortfolioUsd: nw?.netWorth ?? null,
    tradeCount: nw?.tradeCount ?? trades.length,
    tradeVolume: nw?.tradeVolume ?? null,
    firstTradeDate: dates[0] ?? null,
    lastTradeDate: dates[dates.length - 1] ?? null,
    topHoldings: mostTraded, // activity summary only; not disclosed holdings
    mostTradedTickers: mostTraded,
    disclosedHoldingsAvailable: false,
    estimatedLivePortfolioAvailable: false,
    computedAt: getDatasetLastUpdated("politician_net_worth") || new Date().toISOString(),
    source: "quiver" as const,
  };
}

export async function getFinancialOverview(bioguideId: string) {
  const [nw, trades, snapshot, source] = await Promise.all([
    getNetWorthForMember(bioguideId),
    getTradesForMember(bioguideId, 5),
    getPortfolioSnapshot(bioguideId),
    Promise.resolve(getQuiverSourceMeta()),
  ]);
  return {
    estimatedNetWorth: nw?.netWorth ?? null,
    tradeCount: nw?.tradeCount ?? snapshot.tradeCount,
    tradeVolume: nw?.tradeVolume ?? null,
    lastUpdated: source.lastUpdated,
    source: source.source,
    recentTradeCount: trades.length,
    tradesSyncComplete: source.tradesSyncComplete,
    tradesSyncStatus: source.tradesSyncStatus,
  };
}

export { getDatasetMeta, isCongressTradesSyncComplete };

