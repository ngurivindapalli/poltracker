import { NextResponse } from "next/server";
import {
  getNetWorthForMember,
  getPortfolioSnapshot,
  getQuiverSourceMeta,
} from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;
  const [nw, snapshot, source] = await Promise.all([
    getNetWorthForMember(bioguideId),
    getPortfolioSnapshot(bioguideId),
    Promise.resolve(getQuiverSourceMeta()),
  ]);

  return NextResponse.json({
    bioguideId,
    totalNetWorth: nw?.netWorth ?? snapshot.estimatedPortfolioUsd ?? 0,
    tradeCount: nw?.tradeCount ?? snapshot.tradeCount,
    tradeVolume: nw?.tradeVolume ?? null,
    holdings: snapshot.topHoldings,
    source: source.source,
    lastUpdated:
      source.meta?.datasets?.politician_net_worth?.lastUpdated ??
      source.lastUpdated,
    disclaimer:
      "Estimated Net Worth from Quiver Quantitative — not an official government figure.",
  });
}
