import Link from "next/link";
import OfficialNewsFeed from "@/components/news/OfficialNewsFeed";
import SenatorImage from "@/components/SenatorImage";
import ConnectionsPanel from "@/components/senator/ConnectionsPanel";
import RecentTrades from "@/components/senator/RecentTrades";
import LargestHoldings from "@/components/senator/LargestHoldings";
import GovernmentContracts from "@/components/senator/GovernmentContracts";
import RecentDisclosures from "@/components/senator/RecentDisclosures";
import FinancialOverview from "@/components/financials/FinancialOverview";
import CompanyMarketSignals from "@/components/financials/CompanyMarketSignals";
import FamilyTree from "@/components/FamilyTree";
import LobbyingTable from "@/components/senator/LobbyingTable";
import AffiliationsGrid from "@/components/senator/AffiliationsGrid";
import SenatorBillsSection from "@/components/senator/SenatorBillsSection";
import Tweets from "@/components/Tweets";
import LazySection from "@/components/ui/LazySection";
import { getMemberByBioguide } from "@/lib/congressData";
import { getSenatorSummary } from "@/lib/senators/summaries";
import { senatorImageUrl } from "@/lib/images";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { CommentSection } from "@/components/comments/CommentSection";

export const revalidate = 600;

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

  const name =
    summary?.name ||
    memberLocal?.name ||
    bioguideId;
  const party = summary?.party || memberLocal?.party || null;
  const state = summary?.state || memberLocal?.state || null;
  const imageUrl =
    summary?.imageUrl ||
    senatorImageUrl(bid, "450x550");
  const twitterHandle = memberLocal?.twitter || "";
  const website = memberLocal?.website || null;

  if (!summary && !memberLocal) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link
          href="/senators"
          className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back to Senators
        </Link>
        <Card className="p-12 text-center bg-red-50 border-red-100">
          <h2 className="text-[20px] font-bold text-red-800 mb-2">
            Unable to load senator data right now.
          </h2>
          <p className="text-red-600">Please try again later.</p>
        </Card>
      </main>
    );
  }

  const overviewInitial = summary
    ? {
        estimatedNetWorth: summary.estimatedNetWorth,
        tradeCount: summary.tradeCount,
        tradeVolume: summary.tradeVolume,
        lastUpdated:
          summary.latestFinancialUpdate || summary.dataUpdatedAt || null,
      }
    : null;

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <Link
        href="/senators"
        className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Senators
      </Link>

      <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 mb-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0">
          <SenatorImage
            bioguideId={bid}
            imageUrl={imageUrl}
            name={name}
            width={160}
            height={160}
          />
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-2 leading-tight">
                {name}
              </h1>
              <div className="flex items-center gap-3 mb-6">
                <Badge
                  variant={
                    party?.toLowerCase().includes("democrat")
                      ? "default"
                      : party?.toLowerCase().includes("republican")
                        ? "danger"
                        : "neutral"
                  }
                  className="text-[14px] px-3 py-1"
                >
                  {party || "—"}
                </Badge>
                <span className="text-[16px] text-[#64748B] font-medium">
                  {state || "—"}
                </span>
                <span className="text-[#E2E8F0]">•</span>
                <span className="text-[16px] text-[#64748B]">U.S. Senator</span>
              </div>
            </div>
            <div className="hidden md:block">
              <Button variant="primary">Follow Updates</Button>
            </div>
          </div>

          {website ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
              <div>
                <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
                  Official Website
                </div>
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[15px] font-medium text-[#2563EB] hover:underline"
                >
                  Visit website →
                </a>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Primary financial overview — from precomputed summary, no live Quiver */}
      <div className="mb-10">
        <FinancialOverview bioguideId={bid} initialData={overviewInitial} />
      </div>

      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Legislative Activity
        </h2>
        <LazySection minHeight={160}>
          <SenatorBillsSection bioguideId={bid} />
        </LazySection>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-10">
          <LazySection minHeight={200}>
            <RecentTrades bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <LargestHoldings bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <GovernmentContracts bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={160}>
            <section>
              <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                Corporate Donors
              </h2>
              <LobbyingTable bioguideId={bid} />
            </section>
          </LazySection>

          <LazySection minHeight={160}>
            <CompanyMarketSignals bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={120}>
            <RecentDisclosures bioguideId={bid} />
          </LazySection>

          <LazySection minHeight={200}>
            <section>
              <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                Family Connections
              </h2>
              <FamilyTree senatorName={name} />
            </section>
          </LazySection>

          <LazySection minHeight={240}>
            <section>
              <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                Influence Network
              </h2>
              <ConnectionsPanel bioguideId={bid} />
            </section>
          </LazySection>
        </div>

        <div className="space-y-10">
          <LazySection minHeight={200}>
            <section>
              <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                Latest Coverage
              </h2>
              <OfficialNewsFeed bioguideId={bid} defaultMode="aligned" />
            </section>
          </LazySection>

          <LazySection minHeight={160}>
            <section>
              <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                Affiliations
              </h2>
              <AffiliationsGrid bioguideId={bid} />
            </section>
          </LazySection>

          <section>
            <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
              Latest Tweets
            </h2>
            {twitterHandle ? (
              <LazySection minHeight={120}>
                <Tweets handle={twitterHandle} />
              </LazySection>
            ) : (
              <div className="text-gray-500">
                No public Twitter/X account available.
              </div>
            )}
          </section>
        </div>
      </div>

      <section className="mt-12">
        <CommentSection
          entityType="politician"
          entityId={bid}
          title="Community Discussion"
        />
      </section>
    </main>
  );
}
