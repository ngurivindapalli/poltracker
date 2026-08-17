import Link from "next/link";
import type { Metadata } from "next";
import OfficialNewsFeed from "@/components/news/OfficialNewsFeed";
import SenatorImage from "@/components/SenatorImage";
import ConnectionsPanel from "@/components/senator/ConnectionsPanel";
import RecentTrades from "@/components/senator/RecentTrades";
import LargestHoldings from "@/components/senator/LargestHoldings";
import CongressHoldings from "@/components/senator/CongressHoldings";
import GovernmentContracts from "@/components/senator/GovernmentContracts";
import RecentDisclosures from "@/components/senator/RecentDisclosures";
import CompanyMarketSignals from "@/components/financials/CompanyMarketSignals";
import CorporateDonorsTable from "@/components/senator/CorporateDonorsTable";
import AffiliationsGrid from "@/components/senator/AffiliationsGrid";
import FamilyTree from "@/components/FamilyTree";
import SenatorBillsSection from "@/components/senator/SenatorBillsSection";
import Tweets from "@/components/Tweets";
import LazySection from "@/components/ui/LazySection";
import { PoliticianNav } from "@/components/politics/PoliticianNav";
import { PartyBadge } from "@/components/politics/PartyBadge";
import { StatCard } from "@/components/ui/StatCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { getMemberByBioguide } from "@/lib/congressData";
import { getSenatorSummary } from "@/lib/senators/summaries";
import { senatorImageUrl } from "@/lib/images";
import { formatUsdCompact } from "@/lib/format";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";
import { CommentSection } from "@/components/comments/CommentSection";

export const revalidate = 600;

export async function generateMetadata({
  params,
}: {
  params: { bioguideId: string };
}): Promise<Metadata> {
  const bid = params.bioguideId.toUpperCase();
  const summary = await getSenatorSummary(bid);
  const name = summary?.name || bid;
  const state = summary?.state ? ` · ${summary.state}` : "";
  return {
    title: `${name} | U.S. Senator`,
    description: `Profile for ${name}, U.S. Senator${state}. Estimated net worth, disclosed trades, legislation, and news from public sources.`,
  };
}

export default async function SenatorPage({
  params,
}: {
  params: { bioguideId: string };
}) {
  const { bioguideId } = params;
  const bid = bioguideId.toUpperCase();

  const [summary, memberLocal] = await Promise.all([
    getSenatorSummary(bid),
    Promise.resolve(getMemberByBioguide(bid) ?? getMemberByBioguide(bioguideId)),
  ]);

  const name = summary?.name || memberLocal?.name || bioguideId;
  const party = summary?.party || memberLocal?.party || null;
  const state = summary?.state || memberLocal?.state || null;
  const imageUrl = summary?.imageUrl || senatorImageUrl(bid, "450x550");
  const twitterHandle = memberLocal?.twitter || "";
  const website = memberLocal?.website || null;

  if (!summary && !memberLocal) {
    return (
      <main className="container-page py-12">
        <Link href="/senators" className="text-sm text-muted-foreground hover:text-foreground">
          ← Senators
        </Link>
        <EmptyState
          className="mt-8"
          title="Unable to load this senator"
          description="Identity data is missing from the local roster and synchronized summaries. Try again after the next data refresh."
        />
      </main>
    );
  }

  return (
    <main className="container-page py-8 sm:py-12">
      <Link
        href="/senators"
        className="mb-6 inline-flex text-sm text-muted-foreground hover:text-foreground"
      >
        ← Senators
      </Link>

      <section
        id="overview"
        className="mb-6 flex flex-col gap-6 rounded-xl border border-border bg-card p-6 shadow-subtle md:flex-row md:items-start"
      >
        <SenatorImage
          bioguideId={bid}
          imageUrl={imageUrl}
          name={name}
          width={128}
          height={128}
        />
        <div className="min-w-0 flex-1">
          <p className="label-caps">U.S. Senator</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">{name}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <PartyBadge party={party} />
            <span className="text-sm text-muted-foreground">{state || "—"}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-foreground underline-offset-4 hover:underline"
              >
                Official website
              </a>
            ) : null}
            {twitterHandle ? (
              <span className="text-muted-foreground">@{twitterHandle}</span>
            ) : null}
          </div>
        </div>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Estimated net worth"
          value={formatUsdCompact(summary?.estimatedNetWorth)}
          hint="Quiver estimate"
        />
        <StatCard
          label="Disclosed trades"
          value={summary?.tradeCount ?? "—"}
        />
        <StatCard
          label="Trade volume"
          value={formatUsdCompact(summary?.tradeVolume)}
        />
        <StatCard
          label="Latest trade"
          value={summary?.latestTradeDate || "—"}
        />
      </div>

      <div className="mb-4">
        <QuiverSourceLabel
          lastUpdated={summary?.latestFinancialUpdate || summary?.dataUpdatedAt}
          estimateDisclaimer
        />
      </div>

      <PoliticianNav />

      <div id="financials" className="scroll-mt-28">
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">Financial overview</h2>
          <p className="mb-4 max-w-2xl text-sm text-muted-foreground">
            Estimated net worth, trade count, and trade volume from synchronized
            Quiver data. See the overview cards above for headline figures.
          </p>
        </section>
      </div>

      <section id="legislation" className="mt-10 scroll-mt-28">
        <h2 className="mb-4 text-xl font-semibold">Legislation</h2>
        <LazySection minHeight={160}>
          <SenatorBillsSection bioguideId={bid} />
        </LazySection>
      </section>

      <div className="mt-10 grid grid-cols-1 gap-10 lg:grid-cols-3">
        <div className="space-y-10 lg:col-span-2">
          <div id="trading" className="scroll-mt-28">
            <LazySection minHeight={200}>
              <RecentTrades bioguideId={bid} />
            </LazySection>
          </div>

          <LazySection minHeight={160}>
            <CongressHoldings bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <LargestHoldings bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <GovernmentContracts bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <section>
              <h2 className="mb-4 text-xl font-semibold">Corporate donors</h2>
              <CorporateDonorsTable bioguideId={bid} />
            </section>
          </LazySection>

          <LazySection minHeight={160}>
            <CompanyMarketSignals bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={120}>
            <RecentDisclosures bioguideId={bid} />
          </LazySection>

          <div id="relationships" className="scroll-mt-28 space-y-10">
            <LazySection minHeight={200}>
              <section>
                <h2 className="mb-4 text-xl font-semibold">Family connections</h2>
                <FamilyTree senatorName={name} />
              </section>
            </LazySection>
            <LazySection minHeight={240}>
              <section>
                <h2 className="mb-4 text-xl font-semibold">Influence network</h2>
                <ConnectionsPanel bioguideId={bid} />
              </section>
            </LazySection>
          </div>
        </div>

        <div className="space-y-10">
          <div id="news" className="scroll-mt-28">
            <LazySection minHeight={200}>
              <section>
                <h2 className="mb-4 text-xl font-semibold">Latest coverage</h2>
                <OfficialNewsFeed bioguideId={bid} defaultMode="aligned" />
              </section>
            </LazySection>
          </div>

          <LazySection minHeight={160}>
            <section>
              <h2 className="mb-4 text-xl font-semibold">Affiliations</h2>
              <AffiliationsGrid bioguideId={bid} />
            </section>
          </LazySection>

          <section>
            <h2 className="mb-4 text-xl font-semibold">Public posts</h2>
            {twitterHandle ? (
              <LazySection minHeight={120}>
                <Tweets handle={twitterHandle} />
              </LazySection>
            ) : (
              <EmptyState
                title="No public X account on file"
                description="This profile does not currently include a linked public Twitter/X handle."
              />
            )}
          </section>
        </div>
      </div>

      <section className="mt-12">
        <CommentSection
          entityType="politician"
          entityId={bid}
          title="Community discussion"
        />
      </section>
    </main>
  );
}
