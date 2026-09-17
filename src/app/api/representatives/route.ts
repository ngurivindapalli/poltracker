import { NextResponse } from "next/server";
import { getRepresentativeSummaries } from "@/lib/representatives/summaries";

export const runtime = "nodejs";
export const revalidate = 600;

export async function GET() {
  const payload = await getRepresentativeSummaries();
  return NextResponse.json(
    { representatives: payload.representatives, ...payload },
    {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    }
  );
}
