import { NextResponse } from "next/server";
import { getDonorsForMember, getQuiverSourceMeta } from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const bioguideId = url.searchParams.get("bioguideId");
  if (!bioguideId) {
    return NextResponse.json(
      { error: "bioguideId required" },
      { status: 400 }
    );
  }
  const donors = await getDonorsForMember(bioguideId, 100);
  const source = getQuiverSourceMeta();
  return NextResponse.json({
    donors,
    count: donors.length,
    source: source.source,
    lastUpdated: source.meta?.datasets?.corporate_donors?.lastUpdated ?? null,
  });
}
