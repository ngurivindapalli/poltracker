import { NextResponse } from "next/server";
import {
  getContractsForMember,
  getContractsForTickers,
  getDisclosedHoldingsAvailability,
  getDisclosuresForMember,
  getDonorsForMember,
  getFinancialOverview,
  getHoldingsForMember,
  getLobbyingForTickers,
  getOffExchangeForTickers,
  getPortfolioSnapshot,
  getQuiverSourceMeta,
  getTradesForMember,
  mostTradedFromTrades,
} from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;
  if (!bioguideId) {
    return NextResponse.json({ error: "bioguideId required" }, { status: 400 });
  }

  try {
    const [
      recentTrades,
      historyTrades,
      contracts,
      disclosures,
      snapshot,
      overview,
      donors,
      holdingsAvailability,
      congressHoldingsRow,
    ] = await Promise.all([
      getTradesForMember(bioguideId, 50),
      getTradesForMember(bioguideId, 2000),
      getContractsForMember(bioguideId, 40),
      getDisclosuresForMember(bioguideId, 8),
      getPortfolioSnapshot(bioguideId),
      getFinancialOverview(bioguideId),
      getDonorsForMember(bioguideId, 25),
      getDisclosedHoldingsAvailability(bioguideId),
      getHoldingsForMember(bioguideId),
    ]);

    const mostTradedTickers = mostTradedFromTrades(historyTrades, 10);
    const tickers = [
      ...new Set(
        historyTrades
          .map((t) => t.ticker)
          .filter(Boolean)
          .map((t) => String(t).toUpperCase())
      ),
    ] as string[];

    const [lobbying, offExchange, contractsByTicker] = await Promise.all([
      getLobbyingForTickers(tickers, 40),
      getOffExchangeForTickers(tickers, 40),
      getContractsForTickers(tickers, 40),
    ]);

    const governmentContracts =
      contracts.length > 0 ? contracts : contractsByTicker;

    const portfolioHistoryMap = new Map<string, number>();
    for (const t of historyTrades) {
      if (!t.tradeDate) continue;
      const month = t.tradeDate.slice(0, 7);
      portfolioHistoryMap.set(month, (portfolioHistoryMap.get(month) || 0) + 1);
    }
    const portfolioHistory = [...portfolioHistoryMap.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, tradeCount]) => ({
        date: `${month}-01`,
        tradeCount,
      }));

    const source = getQuiverSourceMeta();
    const holdingsMeta = source.meta?.datasets?.congress_holdings;

    return NextResponse.json({
      bioguideId,
      source: source.source,
      lastUpdated: source.lastUpdated,
      tradesSyncComplete: source.tradesSyncComplete,
      tradesSyncStatus: source.tradesSyncStatus,
      tradesRecordCount: source.tradesRecordCount,
      tradesCoverageStart: source.tradesCoverageStart,
      tradesCoverageEnd: source.tradesCoverageEnd,
      financialOverview: overview,
      recentTrades,
      mostTradedTickers,
      largestHoldings: mostTradedTickers,
      disclosedHoldings: holdingsAvailability.disclosedHoldings,
      estimatedLivePortfolio: holdingsAvailability.estimatedLivePortfolio,
      holdingsAvailability,
      congressHoldings: congressHoldingsRow
        ? {
            politicianName: congressHoldingsRow.politicianName,
            positions: congressHoldingsRow.positions,
            lastUpdated: holdingsMeta?.lastUpdated ?? congressHoldingsRow.fetchedAt,
          }
        : null,
      governmentContracts,
      corporateDonors: donors,
      corporateLobbying: lobbying,
      offExchange,
      recentFinancialDisclosures: disclosures,
      estimatedNetWorth: overview.estimatedNetWorth,
      portfolioSnapshot: snapshot,
      portfolioHistory,
      contractHistory: governmentContracts.map((c) => ({
        date: c.awardDate,
        amount: c.amount,
        agency: c.agency,
        ticker: c.ticker,
      })),
    });
  } catch (e) {
    console.error("financial-profile error", e);
    return NextResponse.json(
      {
        bioguideId,
        source: "Quiver Quantitative",
        recentTrades: [],
        mostTradedTickers: [],
        largestHoldings: [],
        disclosedHoldings: [],
        estimatedLivePortfolio: [],
        congressHoldings: null,
        governmentContracts: [],
        corporateDonors: [],
        corporateLobbying: [],
        offExchange: [],
        recentFinancialDisclosures: [],
        estimatedNetWorth: null,
        portfolioSnapshot: null,
        portfolioHistory: [],
        contractHistory: [],
        error: "Failed to load financial profile",
      },
      { status: 200 }
    );
  }
}
