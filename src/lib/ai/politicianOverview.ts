import { getSenatorSummary } from "@/lib/senators/summaries";
import { getRepresentativeSummary } from "@/lib/representatives/summaries";
import { getMemberLegislation } from "@/lib/legislation/store";
import { getMemberByBioguide } from "@/lib/congressData";
import { getPrisma } from "@/lib/db";
import { formatUsdCompact } from "@/lib/format";

export type OverviewContext = {
  bioguideId: string;
  fingerprint: string;
  office: string;
  name: string;
  party: string | null;
  state: string | null;
  district: string | null;
  website: string | null;
  estimatedNetWorth: string | null;
  tradeCount: string | null;
  tradeVolume: string | null;
  latestTrade: string | null;
  financialUpdated: string | null;
  legislationUpdated: string | null;
  sponsored: Array<{ id: string; title: string; action: string | null }>;
  cosponsored: Array<{ id: string; title: string; action: string | null }>;
  news: Array<{ title: string; source: string | null; publishedAt: string | null }>;
};

function billLabel(b: { type: string; number: string; title: string; latestAction: string | null }) {
  return {
    id: `${b.type.toUpperCase()} ${b.number}`,
    title: b.title,
    action: b.latestAction,
  };
}

export async function buildOverviewContext(bioguideId: string): Promise<OverviewContext | null> {
  const bid = bioguideId.toUpperCase();
  const [senator, rep, legislation, local] = await Promise.all([
    getSenatorSummary(bid),
    getRepresentativeSummary(bid),
    getMemberLegislation(bid),
    Promise.resolve(getMemberByBioguide(bid)),
  ]);
  const summary = senator || (rep && rep.chamber === "house" ? rep : null);
  const identity = senator || rep;
  if (!identity && !local) return null;

  let news: OverviewContext["news"] = [];
  try {
    const prisma = await getPrisma();
    if (prisma?.cachedNewsArticle) {
      const rows = await prisma.cachedNewsArticle.findMany({
        where: { bioguideId: bid },
        orderBy: { publishedAt: "desc" },
        take: 5,
      });
      news = rows.map((r: any) => ({
        title: r.title,
        source: r.source,
        publishedAt: r.publishedAt ? new Date(r.publishedAt).toISOString() : null,
      }));
    }
  } catch {
    news = [];
  }

  const office =
    senator || local?.role === "Senator" ? "U.S. Senator" : "U.S. Representative";
  const fingerprint = [
    bid,
    identity?.dataUpdatedAt || "",
    legislation.lastUpdated || legislation.status,
    String(legislation.sponsored.length),
    String(legislation.cosponsored.length),
    news[0]?.title || "",
  ].join("|");

  return {
    bioguideId: bid,
    fingerprint,
    office,
    name: identity?.name || local?.name || bid,
    party: identity?.party || local?.party || null,
    state: identity?.state || local?.state || null,
    district: "district" in (identity || {}) ? (identity as any).district || null : null,
    website: local?.website || null,
    estimatedNetWorth:
      identity?.estimatedNetWorth == null
        ? null
        : formatUsdCompact(identity.estimatedNetWorth),
    tradeCount: identity?.tradeCount == null ? null : String(identity.tradeCount),
    tradeVolume:
      identity?.tradeVolume == null ? null : formatUsdCompact(identity.tradeVolume),
    latestTrade: identity?.latestTradeDate || null,
    financialUpdated: identity?.latestFinancialUpdate || identity?.dataUpdatedAt || null,
    legislationUpdated: legislation.lastUpdated,
    sponsored: legislation.sponsored.slice(0, 8).map(billLabel),
    cosponsored: legislation.cosponsored.slice(0, 8).map(billLabel),
    news,
  };
}

export function fallbackOverview(ctx: OverviewContext): string {
  const place = [ctx.state, ctx.district ? `District ${ctx.district}` : null]
    .filter(Boolean)
    .join(", ");
  const glance = [
    `${ctx.name} is listed in Politeia as ${ctx.office}${place ? ` (${place})` : ""}.`,
    ctx.party ? `Party on file: ${ctx.party}.` : "Party is not available in the synchronized record.",
    ctx.website
      ? `An official website is listed.`
      : "No official website is stored on this profile.",
  ].join(" ");

  const legislative =
    ctx.sponsored.length || ctx.cosponsored.length
      ? `Synchronized legislative records include ${ctx.sponsored.length} recent sponsored item(s) and ${ctx.cosponsored.length} recent cosponsored item(s).${
          ctx.sponsored[0] ? ` A recent sponsored item is ${ctx.sponsored[0].id}: ${ctx.sponsored[0].title}.` : ""
        }`
      : ctx.legislationUpdated
        ? "Legislative records were synchronized, and no recent sponsored or cosponsored items are stored for this member."
        : "Legislative records have not been synchronized for this member.";

  const financial =
    ctx.estimatedNetWorth || ctx.tradeCount
      ? `Synchronized Quiver figures on file: estimated net worth ${ctx.estimatedNetWorth || "unavailable"}, disclosed trades ${ctx.tradeCount || "unavailable"}, trade volume ${ctx.tradeVolume || "unavailable"}${ctx.latestTrade ? `, latest trade date ${ctx.latestTrade}` : ""}. These are estimates from synchronized disclosures, not an official net-worth filing.`
      : "Financial estimates are unavailable in the synchronized Quiver summary for this member.";

  const coverage = ctx.news.length
    ? `Recent stored coverage includes: ${ctx.news
        .slice(0, 3)
        .map((n) => n.title)
        .join("; ")}.`
    : "No synchronized news articles are stored for this member.";

  return [
    "AI OVERVIEW",
    "This text restates records already stored in Politeia. It is not a recommendation or ranking.",
    "",
    "At a glance",
    glance,
    "",
    "Legislative activity",
    legislative,
    "",
    "Financial activity",
    financial,
    "",
    "Recent coverage",
    coverage,
    "",
    "Key data points",
    `- Office: ${ctx.office}`,
    `- Sponsored records shown: ${ctx.sponsored.length}`,
    `- Cosponsored records shown: ${ctx.cosponsored.length}`,
    `- Estimated net worth: ${ctx.estimatedNetWorth || "unavailable"}`,
    "",
    "Data sources",
    "Congress.gov legislation (synchronized), Quiver Quantitative financial summaries (synchronized), and stored news where present.",
    `Legislative sync: ${ctx.legislationUpdated || "not available"}`,
    `Financial sync: ${ctx.financialUpdated || "not available"}`,
  ].join("\n");
}
