/**
 * Server-side loaders for congressional trades, contracts, disclosures, portfolio.
 * Prefer Postgres (Prisma); fall back to generated JSON so profiles still render.
 */

import fs from "fs";
import path from "path";
import { prisma } from "@/lib/prisma";

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

function isoDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  if (typeof d === "string") return d.slice(0, 10);
  return d.toISOString().slice(0, 10);
}

function amountLabel(low: number | null, high: number | null): string | null {
  if (low == null && high == null) return null;
  if (low != null && high != null) {
    return `$${low.toLocaleString()} - $${high.toLocaleString()}`;
  }
  if (low != null && high == null) return `$${low.toLocaleString()}+`;
  return high != null ? `$${high.toLocaleString()}` : null;
}

export async function getTradesForMember(
  bioguideId: string,
  limit = 50
): Promise<TradeRow[]> {
  const bid = bioguideId.toUpperCase();

  try {
    const rows = await prisma.ptrTransaction.findMany({
      where: { filing: { bioguideId: bid } },
      include: { filing: true },
      orderBy: { txDate: "desc" },
      take: limit,
    });
    if (rows.length > 0) {
      return rows.map((t) => ({
        id: t.id,
        bioguideId: bid,
        ticker: t.ticker,
        asset: t.assetDesc,
        assetType: t.assetType,
        txType: t.txType,
        buySell: t.buySell,
        amountLow: t.amountLow,
        amountHigh: t.amountHigh,
        amountLabel: amountLabel(t.amountLow, t.amountHigh),
        tradeDate: isoDate(t.txDate),
        filingDate: isoDate(t.filing.filingDate),
        owner: t.owner,
        comment: t.comment,
        source: t.source,
      }));
    }
  } catch (e) {
    console.warn("getTradesForMember DB fallback:", (e as Error).message);
  }

  // JSON fallback (written by services/import_trading.py)
  try {
    const filePath = path.join(process.cwd(), "src", "data", "congress-trading-all.json");
    if (!fs.existsSync(filePath)) {
      const alt = path.join(process.cwd(), "public", "data", "senateTrades.json");
      if (!fs.existsSync(alt)) return [];
      const all = JSON.parse(fs.readFileSync(alt, "utf8")) as any[];
      return all
        .filter(
          (r) =>
            (r.bioguideId || "").toUpperCase() === bid ||
            false
        )
        .sort((a, b) =>
          String(b.transactionDate || "").localeCompare(String(a.transactionDate || ""))
        )
        .slice(0, limit)
        .map((r) => ({
          bioguideId: bid,
          ticker: r.ticker ?? null,
          asset: r.asset || "",
          assetType: r.assetType ?? null,
          txType: r.type || "",
          buySell: r.buySell ?? null,
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
    const all = JSON.parse(fs.readFileSync(filePath, "utf8")) as any[];
    return all
      .filter((r) => (r.BioGuideID || "").toUpperCase() === bid)
      .sort((a, b) =>
        String(b.Traded || b.Filed || "").localeCompare(String(a.Traded || a.Filed || ""))
      )
      .slice(0, limit)
      .map((r) => ({
        bioguideId: bid,
        ticker: r.Ticker ?? null,
        asset: r.Company || "",
        assetType: r.TickerType ?? null,
        txType: r.Transaction || "",
        buySell: null,
        amountLow: null,
        amountHigh: null,
        amountLabel: r.Trade_Size_USD ?? null,
        tradeDate: r.Traded ?? null,
        filingDate: r.Filed ?? null,
        owner: r.Subholding ?? null,
        comment: r.Comments ?? null,
        source: "quiver",
      }));
  } catch {
    return [];
  }
}

export async function getLargestHoldings(
  bioguideId: string,
  limit = 10
): Promise<Array<{ ticker: string; tradeCount: number; lastTradeDate: string | null }>> {
  const bid = bioguideId.toUpperCase();

  try {
    const snap = await prisma.portfolioSnapshot.findUnique({ where: { bioguideId: bid } });
    if (snap?.topHoldingsJson) {
      const parsed = JSON.parse(snap.topHoldingsJson) as Array<{
        ticker: string;
        tradeCount: number;
      }>;
      return parsed.slice(0, limit).map((h) => ({
        ticker: h.ticker,
        tradeCount: h.tradeCount,
        lastTradeDate: null,
      }));
    }
  } catch {
    // fall through
  }

  const trades = await getTradesForMember(bioguideId, 5000);
  const counts = new Map<string, { tradeCount: number; lastTradeDate: string | null }>();
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

export async function getContractsForMember(
  bioguideId: string,
  limit = 50
): Promise<ContractRow[]> {
  const bid = bioguideId.toUpperCase();
  const trades = await getTradesForMember(bid, 5000);
  const tickers = [
    ...new Set(
      trades.map((t) => (t.ticker || "").toUpperCase()).filter(Boolean)
    ),
  ];
  if (tickers.length === 0) return [];

  try {
    const rows = await prisma.governmentContract.findMany({
      where: { ticker: { in: tickers } },
      orderBy: [{ awardDate: "desc" }, { amount: "desc" }],
      take: limit,
    });
    if (rows.length > 0) {
      return rows.map((c) => ({
        id: c.id,
        ticker: c.ticker,
        vendor: c.vendor,
        agency: c.agency,
        awardDate: isoDate(c.awardDate),
        description: c.description,
        amount: c.amount,
        status: c.status,
        source: c.source,
      }));
    }
  } catch (e) {
    console.warn("getContractsForMember DB fallback:", (e as Error).message);
  }

  try {
    const filePath = path.join(process.cwd(), "public", "data", "contracts-recent.json");
    if (!fs.existsSync(filePath)) return [];
    const all = JSON.parse(fs.readFileSync(filePath, "utf8")) as any[];
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
  } catch {
    return [];
  }
}

export async function getDisclosuresForMember(
  bioguideId: string,
  limit = 10
): Promise<DisclosureRow[]> {
  const bid = bioguideId.toUpperCase();
  try {
    const rows = await prisma.annualDisclosure.findMany({
      where: { bioguideId: bid },
      include: { assets: true },
      orderBy: { year: "desc" },
      take: limit,
    });
    return rows.map((d) => ({
      id: d.id,
      year: d.year,
      filingType: d.filingType,
      sourceUrl: d.sourceUrl,
      assets: d.assets.map((a) => ({
        description: a.description,
        valueLow: a.valueLow,
        valueHigh: a.valueHigh,
        incomeType: a.incomeType,
      })),
    }));
  } catch (e) {
    console.warn("getDisclosuresForMember error:", (e as Error).message);
    return [];
  }
}

export async function getPortfolioSnapshot(bioguideId: string) {
  const bid = bioguideId.toUpperCase();
  try {
    const snap = await prisma.portfolioSnapshot.findUnique({
      where: { bioguideId: bid },
    });
    if (snap) {
      return {
        estimatedPortfolioUsd: snap.estimatedPortfolioUsd,
        tradeCount: snap.tradeCount,
        firstTradeDate: isoDate(snap.firstTradeDate),
        lastTradeDate: isoDate(snap.lastTradeDate),
        topHoldings: snap.topHoldingsJson
          ? JSON.parse(snap.topHoldingsJson)
          : [],
        computedAt: snap.computedAt,
      };
    }
  } catch {
    // ignore
  }
  return null;
}
