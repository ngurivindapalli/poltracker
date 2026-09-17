import { NextResponse } from "next/server";
import { getMemberLegislation } from "@/lib/legislation/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguide = params.bioguideId;
  const payload = await getMemberLegislation(bioguide);

  console.info(
    `Congress legislation request: member=${bioguide} status=${payload.status} sponsored=${payload.sponsored.length} cosponsored=${payload.cosponsored.length} source=postgres`
  );

  return NextResponse.json(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
    },
  });
}
