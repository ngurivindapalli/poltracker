/**
 * GET /api/senators — one payload for the entire Senators listing.
 * Reads precomputed SenatorSummary (Postgres or warehouse JSON).
 * Never calls Quiver or Congress.gov.
 */
import { NextResponse } from "next/server";
import { getSenatorSummaries } from "@/lib/senators/summaries";

export const runtime = "nodejs";
/** Revalidate listing every 10 minutes; sync rebuilds warehouse between. */
export const revalidate = 600;

export async function GET() {
  try {
    const payload = await getSenatorSummaries();
    return NextResponse.json(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600",
      },
    });
  } catch (err: unknown) {
    console.error(
      "Failed loading senator summaries:",
      err instanceof Error ? err.message : String(err)
    );
    return NextResponse.json(
      {
        senators: [],
        dataUpdatedAt: null,
        source: "SenatorSummary",
        count: 0,
        error: "Failed to load senator summaries",
      },
      { status: 200 }
    );
  }
}
