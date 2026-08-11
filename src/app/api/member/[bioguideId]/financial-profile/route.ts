import { NextResponse } from "next/server";
import {
  getContractsForMember,
  getDisclosuresForMember,
  getDonorsForMember,
  getFinancialOverview,
  getLargestHoldings,
  getLobbyingForTickers,
  getOffExchangeForTickers,
  getPortfolioSnapshot,
  getQuiverSourceMeta,
  getTradesForMember,
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
    const [recentTrades, largestHoldings, contracts, disclosures, snapshot, overview, donors] =
      await Promise.all([
        getTradesForMember(bioguideId, 25),
        getLargestHoldings(bioguideId, 10),
        getContractsForMember(bioguideId, 40),
        getDisclosuresForMember(bioguideId, 8),
        getPortfolioSnapshot(bioguideId),
        getFinancialOverview(bioguideId),
        getDonorsForMember(bioguideId, 25),
      ]);

    const tickers = [
      ...new Set(
        recentTrades
          .map((t) => t.ticker)
          .filter(Boolean)
          .map((t) => String(t).toUpperCase())
      ),
    ] as string[];

    const [lobbying, offExchange] = await Promise.all([
      getLobbyingForTickers(tickers, 40),
      getOffExchangeForTickers(tickers, 40),
    ]);

    const portfolioHistoryMap = new Map<string, number>();
    const historyTrades = await getTradesForMember(bioguideId, 2000);
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

    return NextResponse.json({
      bioguideId,
      source: source.source,
      lastUpdated: source.lastUpdated,
      financialOverview: overview,
      recentTrades,
      largestHoldings,
      governmentContracts: contracts,
      corporateDonors: donors,
      corporateLobbying: lobbying,
      offExchange,
      recentFinancialDisclosures: disclosures,
      estimatedNetWorth: overview.estimatedNetWorth,
      portfolioSnapshot: snapshot,
      portfolioHistory,
      contractHistory: contracts.map((c) => ({
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
        largestHoldings: [],
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
