import { NextResponse } from "next/server";
import { getRecentLegislation } from "@/lib/legislation/recent";

export const runtime = "nodejs";
export const revalidate = 60;

export async function GET() {
  try {
    const result = await getRecentLegislation(50);
    const bills = result.bills.map((b) => ({
      number: b.billNumber,
      type: b.billType,
      title: b.title,
      congress: b.congress,
      originChamber: b.originChamber,
      latestAction: b.latestAction,
      updateDate: b.updateDate,
      congressUrl: b.congressUrl,
    }));

    return NextResponse.json(
      { bills },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      }
    );
  } catch {
    return NextResponse.json({ bills: [] });
  }
}
