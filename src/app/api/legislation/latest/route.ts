import { NextResponse } from "next/server";
import { getRecentLegislation } from "@/lib/legislation/recent";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  const result = await getRecentLegislation(10);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
