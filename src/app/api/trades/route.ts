import { NextResponse } from "next/server";
import { getTradesForMember, getQuiverSourceMeta } from "@/lib/profileFinancials";
import { readQuiverJson } from "@/lib/quiver/cache";
import type { NormalizedCongressTrade } from "@/lib/quiver/types";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bioguideId = url.searchParams.get("bioguideId");
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const source = getQuiverSourceMeta();

  if (bioguideId) {
    const trades = await getTradesForMember(bioguideId, limit);
    return NextResponse.json({
      trades,
      count: trades.length,
      source: source.source,
      lastUpdated: source.meta?.datasets?.congress_trades?.lastUpdated ?? null,
    });
  }

  const all = readQuiverJson<NormalizedCongressTrade[]>("congressTrades") ?? [];
  return NextResponse.json({
    trades: all.slice(0, limit),
    count: Math.min(all.length, limit),
    total: all.length,
    source: source.source,
    lastUpdated: source.meta?.datasets?.congress_trades?.lastUpdated ?? null,
  });
}
