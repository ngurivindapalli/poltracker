import { NextResponse } from "next/server";
import { getDisclosuresForMember } from "@/lib/profileFinancials";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const disclosures = await getDisclosuresForMember(params.bioguideId);
  return NextResponse.json({ disclosures, count: disclosures.length });
}
