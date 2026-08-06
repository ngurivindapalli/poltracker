import { NextResponse } from "next/server";
import { getContractsForMember } from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);
  const contracts = await getContractsForMember(params.bioguideId, limit);
  return NextResponse.json({ contracts, count: contracts.length });
}
