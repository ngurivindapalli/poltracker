import { NextResponse } from "next/server";
import { getDonorsForMember, getQuiverSourceMeta } from "@/lib/profileFinancials";

export const runtime = "nodejs";

/**
 * Prefer Quiver corporate donors (by BioGuideID).
 * Falls back to empty if Quiver cache empty — does not invent data.
 */
export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  const bioguideId = params.bioguideId;
  const donors = await getDonorsForMember(bioguideId, 50);
  const source = getQuiverSourceMeta();

  const top_donors = donors.map((d, i) => ({
    id: `${bioguideId}-donor-${i}`,
    name: d.company || "Unknown",
    amount: Math.abs(d.amount || 0),
    type: d.pac ? ("PAC" as const) : ("Individual" as const),
    industry: d.ticker || undefined,
    cycle: d.cycle ?? undefined,
    date: d.date ?? undefined,
    source: "quiver",
  }));

  const byIndustry = new Map<string, number>();
  for (const d of donors) {
    const key = d.ticker || d.company || "Other";
    byIndustry.set(key, (byIndustry.get(key) || 0) + Math.abs(d.amount || 0));
  }
  const industry_breakdown = [...byIndustry.entries()]
    .map(([industry, total]) => ({
      industry,
      total,
      percentage: 0,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);

  const sum = industry_breakdown.reduce((s, x) => s + x.total, 0) || 1;
  for (const row of industry_breakdown) {
    row.percentage = Math.round((row.total / sum) * 1000) / 10;
  }

  return NextResponse.json({
    top_donors,
    industry_breakdown,
    source: source.source,
    lastUpdated: source.meta?.datasets?.corporate_donors?.lastUpdated ?? null,
  });
}
