import { NextResponse } from "next/server";
import {
  getContractsForMember,
  getDisclosuresForMember,
  getLargestHoldings,
  getPortfolioSnapshot,
  getTradesForMember,
} from "@/lib/profileFinancials";

export const runtime = "nodejs";

/**
 * Comprehensive financial profile payload for a member.
 * Sections: recent trades, holdings, contracts, disclosures, net worth snapshot, portfolio/contract history.
 */
export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;
  if (!bioguideId) {
    return NextResponse.json({ error: "bioguideId required" }, { status: 400 });
  }

  try {
    const [recentTrades, largestHoldings, contracts, disclosures, snapshot] =
      await Promise.all([
        getTradesForMember(bioguideId, 25),
        getLargestHoldings(bioguideId, 10),
        getContractsForMember(bioguideId, 40),
        getDisclosuresForMember(bioguideId, 8),
        getPortfolioSnapshot(bioguideId),
      ]);

    const contractHistory = contracts.map((c) => ({
      date: c.awardDate,
      amount: c.amount,
      agency: c.agency,
      ticker: c.ticker,
    }));

    // Portfolio history: monthly trade counts from recent pool
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

    return NextResponse.json({
      bioguideId,
      recentTrades,
      largestHoldings,
      governmentContracts: contracts,
      recentFinancialDisclosures: disclosures,
      estimatedNetWorth: snapshot?.estimatedPortfolioUsd ?? null,
      portfolioSnapshot: snapshot,
      portfolioHistory,
      contractHistory,
    });
  } catch (e) {
    console.error("financial-profile error", e);
    return NextResponse.json(
      {
        bioguideId,
        recentTrades: [],
        largestHoldings: [],
        governmentContracts: [],
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
