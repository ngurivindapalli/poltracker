/**
 * Server-side loaders for trades, contracts, disclosures, portfolio.
 * Reads static JSON datasets only (no Prisma / DB dependency at build or runtime).
 */

import fs from "fs";
import path from "path";

export type TradeRow = {
  id?: string;
  bioguideId: string;
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
};

export type ContractRow = {
  id?: string;
  ticker: string;
  vendor: string;
  agency: string | null;
  awardDate: string | null;
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

function readJsonFile<T>(...parts: string[]): T | null {
  try {
    const filePath = path.join(process.cwd(), ...parts);
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
  } catch {
    return null;
  }
}

function buySellFromType(tx: string | null | undefined): string | null {
  if (!tx) return null;
  const t = tx.toLowerCase();
  if (t.includes("purchase") || t.includes("buy")) return "buy";
  if (t.includes("sale") || t.includes("sell")) return "sell";
  if (t.includes("exchange")) return "exchange";
  return null;
}

export async function getTradesForMember(
  bioguideId: string,
  limit = 50
): Promise<TradeRow[]> {
  const bid = bioguideId.toUpperCase();

  const congress = readJsonFile<any[]>("src", "data", "congress-trading-all.json");
  if (Array.isArray(congress) && congress.length > 0) {
    return congress
      .filter((r) => (r.BioGuideID || "").toUpperCase() === bid)
      .sort((a, b) =>
        String(b.Traded || b.Filed || "").localeCompare(
          String(a.Traded || a.Filed || "")
        )
      )
      .slice(0, limit)
      .map((r) => ({
        bioguideId: bid,
        ticker: r.Ticker ?? null,
        asset: r.Company || "",
        assetType: r.TickerType ?? null,
        txType: r.Transaction || "",
        buySell: buySellFromType(r.Transaction),
        amountLow: null,
        amountHigh: null,
        amountLabel: r.Trade_Size_USD ?? null,
        tradeDate: r.Traded ?? null,
        filingDate: r.Filed ?? null,
        owner: r.Subholding ?? null,
        comment: r.Comments ?? null,
        source: "quiver",
      }));
  }

  const senate = readJsonFile<any[]>("public", "data", "senateTrades.json");
  if (!Array.isArray(senate)) return [];

  return senate
    .filter((r) => (r.bioguideId || "").toUpperCase() === bid)
    .sort((a, b) =>
      String(b.transactionDate || "").localeCompare(
        String(a.transactionDate || "")
      )
    )
    .slice(0, limit)
    .map((r) => ({
      bioguideId: bid,
      ticker: r.ticker ?? null,
      asset: r.asset || "",
      assetType: r.assetType ?? null,
      txType: r.type || "",
      buySell: r.buySell ?? buySellFromType(r.type),
      amountLow: r.amountLow ?? null,
      amountHigh: r.amountHigh ?? null,
      amountLabel: r.amount ?? null,
      tradeDate: r.transactionDate ?? null,
      filingDate: r.reportDate ?? null,
      owner: r.owner ?? null,
      comment: r.comment ?? null,
      source: r.source ?? null,
    }));
}

export async function getLargestHoldings(
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
    const prev = counts.get(key) || {
      tradeCount: 0,
      lastTradeDate: null as string | null,
    };
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

export async function getContractsForMember(
  bioguideId: string,
  limit = 50
): Promise<ContractRow[]> {
  const trades = await getTradesForMember(bioguideId, 5000);
  const tickers = [
    ...new Set(
      trades.map((t) => (t.ticker || "").toUpperCase()).filter(Boolean)
    ),
  ];
  if (tickers.length === 0) return [];

  const all = readJsonFile<any[]>("public", "data", "contracts-recent.json");
  if (!Array.isArray(all)) return [];

  const tickerSet = new Set(tickers);
  return all
    .filter((c) => tickerSet.has(String(c.ticker || "").toUpperCase()))
    .sort((a, b) =>
      String(b.awardDate || "").localeCompare(String(a.awardDate || ""))
    )
    .slice(0, limit)
    .map((c) => ({
      ticker: c.ticker,
      vendor: c.vendor || c.ticker,
      agency: c.agency ?? null,
      awardDate: c.awardDate ?? null,
      description: c.description ?? null,
      amount: c.amount ?? null,
      status: c.status ?? null,
      source: c.source ?? null,
    }));
}

export async function getDisclosuresForMember(
  bioguideId: string,
  limit = 10
): Promise<DisclosureRow[]> {
  const bid = bioguideId.toUpperCase();
  const year = new Date().getFullYear();

  // investments.json shapes: { US: { [bioguide]: holdings[] } } or { [bioguide]: holdings[] }
  const data =
    readJsonFile<any>("public", "data", "investments.json") ||
    readJsonFile<any>("data", "investments.json");
  if (!data) return [];

  const byMember =
    data.US && typeof data.US === "object" ? data.US : data;
  const holdings = byMember?.[bid] ?? byMember?.[bioguideId];
  if (!Array.isArray(holdings) || holdings.length === 0) return [];

  const assets = holdings.map((h: any) => {
    const range = h?.estimated_value_range;
    return {
      description: String(
        h?.description || h?.asset || h?.name || "Holding"
      ),
      valueLow:
        range?.min != null
          ? Number(range.min)
          : range?.low != null
            ? Number(range.low)
            : null,
      valueHigh:
        range?.max != null
          ? Number(range.max)
          : range?.high != null
            ? Number(range.high)
            : null,
      incomeType: h?.income_type ?? h?.type ?? null,
    };
  });

  return [
    {
      id: `local-${bid}-${year}`,
      year,
      filingType: "annual",
      sourceUrl: `local://investments/${bid}`,
      assets,
    },
  ].slice(0, limit);
}

export async function getPortfolioSnapshot(bioguideId: string) {
  const trades = await getTradesForMember(bioguideId, 5000);
  if (trades.length === 0) return null;

  const holdings = await getLargestHoldings(bioguideId, 10);
  const dates = trades
    .map((t) => t.tradeDate)
    .filter(Boolean)
    .sort() as string[];

  return {
    estimatedPortfolioUsd: null as number | null,
    tradeCount: trades.length,
    firstTradeDate: dates[0] ?? null,
    lastTradeDate: dates[dates.length - 1] ?? null,
    topHoldings: holdings.map((h) => ({
      ticker: h.ticker,
      tradeCount: h.tradeCount,
    })),
    computedAt: new Date().toISOString(),
  };
}
