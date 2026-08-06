import { NextResponse } from "next/server";
import { getTradesForMember } from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 500);
  const trades = await getTradesForMember(params.bioguideId, limit);
  return NextResponse.json({ trades, count: trades.length });
}
