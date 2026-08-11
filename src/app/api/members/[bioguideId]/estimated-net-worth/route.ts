import { NextResponse } from "next/server";
import {
  getNetWorthForMember,
  getPortfolioSnapshot,
  getQuiverSourceMeta,
  getTradesForMember,
} from "@/lib/profileFinancials";
import { estimateSeriesFromTrades } from "@/lib/quiver/series";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;
  const [nw, snapshot, trades, source] = await Promise.all([
    getNetWorthForMember(bioguideId),
    getPortfolioSnapshot(bioguideId),
    getTradesForMember(bioguideId, 5000),
    Promise.resolve(getQuiverSourceMeta()),
  ]);

  const series = estimateSeriesFromTrades(trades);
  const latestEstimate =
    nw?.netWorth ??
    (series.length ? series[series.length - 1].value : 0) ??
    0;

  return NextResponse.json({
    bioguideId,
    label: "Estimated Net Worth",
    disclaimer:
      "Estimated Net Worth from Quiver Quantitative is not an official government figure or audited net worth.",
    officeStart: null,
    firstTradeDate: snapshot.firstTradeDate,
    latestEstimate,
    totalEstimatedPurchases: null,
    totalEstimatedSales: null,
    numberOfTrades: nw?.tradeCount ?? trades.length,
    tradeVolume: nw?.tradeVolume ?? null,
    series,
    source: source.source,
    lastUpdated:
      source.meta?.datasets?.politician_net_worth?.lastUpdated ??
      source.lastUpdated,
  });
}
