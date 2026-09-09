import { NextResponse } from "next/server";
import {
  fetchCosponsoredLegislation,
  fetchSponsoredLegislation,
} from "@/lib/congress";

export const runtime = "nodejs";
export const revalidate = 600;

function cleanBills(bills: any[]) {
  if (!Array.isArray(bills)) return [];
  return bills
    .filter(
      (b) => b && b.number && b.type && (b.titles?.length || b.title)
    )
    .map((b) => ({
      number: b.number,
      type: b.type,
      congress: b.congress,
      title: b.titles?.[0]?.title || b.title,
      latestAction: b.latestAction?.text || null,
    }));
}

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguide = params.bioguideId;

  if (!process.env.API_DATA_GOV_KEY) {
    return NextResponse.json({ sponsored: [], cosponsored: [] });
  }

  try {
    const [sponsoredResult, cosponsoredResult] = await Promise.allSettled([
      fetchSponsoredLegislation(bioguide, 20),
      fetchCosponsoredLegislation(bioguide, 20),
    ]);

    const sponsoredData =
      sponsoredResult.status === "fulfilled" ? sponsoredResult.value : null;
    const cosponsoredData =
      cosponsoredResult.status === "fulfilled" ? cosponsoredResult.value : null;

    return NextResponse.json({
      sponsored: cleanBills(sponsoredData?.sponsoredLegislation || []),
      cosponsored: cleanBills(cosponsoredData?.cosponsoredLegislation || []),
    });
  } catch {
    return NextResponse.json({
      sponsored: [],
      cosponsored: [],
    });
  }
}
