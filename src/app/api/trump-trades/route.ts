import { NextResponse } from "next/server";
import {
  getTrumpTrades,
  getTrumpTradeStats,
  getQuiverSourceMeta,
} from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 100), 500);
  const trades = await getTrumpTrades(limit);
  const stats = getTrumpTradeStats();
  const source = getQuiverSourceMeta();
  return NextResponse.json({
    trades,
    stats,
    count: trades.length,
    source: source.source,
    lastUpdated: source.meta?.datasets?.trump_trades?.lastUpdated ?? null,
    endpoint: "/beta/bulk/trumpstocktrades",
  });
}
