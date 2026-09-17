import Link from 'next/link'
import type { Metadata } from 'next'
import OfficialNewsFeed from '@/components/news/OfficialNewsFeed'
import SenatorImage from '@/components/SenatorImage'
import ConnectionsPanel from '@/components/senator/ConnectionsPanel'
import FamilyTree from '@/components/FamilyTree'
import CorporateDonorsTable from '@/components/senator/CorporateDonorsTable'
import CongressHoldings from '@/components/senator/CongressHoldings'
import AffiliationsGrid from '@/components/senator/AffiliationsGrid'
import FinancialOverview from '@/components/financials/FinancialOverview'
import RecentTrades from '@/components/senator/RecentTrades'
import LargestHoldings from '@/components/senator/LargestHoldings'
import GovernmentContracts from '@/components/senator/GovernmentContracts'
import CompanyMarketSignals from '@/components/financials/CompanyMarketSignals'
import SenatorBillsSection from '@/components/senator/SenatorBillsSection'
import MemberTweets from '@/components/MemberTweets'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { CommentSection } from '@/components/comments/CommentSection'
import { getRepresentativeSummary } from '@/lib/representatives/summaries'
import { getMemberLegislation } from '@/lib/legislation/store'
import { getMemberByBioguide } from '@/lib/congressData'
import { safeMemberImageUrl } from '@/lib/images'

export async function generateMetadata({
  params,
}: {
  params: { bioguideId: string };
}): Promise<Metadata> {
  const representative = await getRepresentativeSummary(params.bioguideId);
  const name = representative?.name || params.bioguideId;
  return {
    title: `${name} | U.S. Representative`,
    description: `Profile for ${name}, U.S. Representative. Legislation, financial disclosures, and news from public sources.`,
  };
}

export default async function RepresentativePage({ params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params
  const bid = bioguideId.toUpperCase()

  const [summary, local, legislation] = await Promise.all([
    getRepresentativeSummary(bid),
    Promise.resolve(getMemberByBioguide(bid) ?? getMemberByBioguide(bioguideId)),
    getMemberLegislation(bid),
  ])

  if (!summary && !local) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/representatives" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <Card className="p-12 text-center bg-red-50 border-red-100">
          <h2 className="text-[20px] font-bold text-red-800 mb-2">
            Unable to load representative data right now.
          </h2>
          <p className="text-red-600">Identity data is missing from the synchronized roster.</p>
        </Card>
      </main>
    )
  }

  const profile = {
    bioguideId: bid,
    name: summary?.name || local?.name || bid,
    party: summary?.party || local?.party || null,
    state: summary?.state || local?.state || null,
    imageUrl: safeMemberImageUrl(bid, summary?.imageUrl, '450x550'),
    officialWebsiteUrl: local?.website || null,
    phoneNumber: local?.phone || local?.phoneNumber || null,
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      {/* HEADER */}
      <section className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 mb-10 shadow-sm flex flex-col md:flex-row gap-8 items-start">
        <div className="flex-shrink-0">
            <SenatorImage
              bioguideId={profile.bioguideId}
              imageUrl={profile.imageUrl}
              name={profile.name}
              width={160}
              height={160}
            />
        </div>

        <div className="flex-grow">
          <div className="flex justify-between items-start">
            <div>
                <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-2 leading-tight">
                    {profile.name}
                </h1>
                <div className="flex items-center gap-3 mb-6">
                    <Badge variant={
                        profile.party?.toLowerCase().includes("democrat") ? "default" : 
                        profile.party?.toLowerCase().includes("republican") ? "danger" : "neutral"
                    } className="text-[14px] px-3 py-1">
                        {profile.party || '—'}
                    </Badge>
                    <span className="text-[16px] text-[#64748B] font-medium">
                        {profile.state || '—'}
                    </span>
                    <span className="text-[#E2E8F0]">•</span>
                    <span className="text-[16px] text-[#64748B]">
                        U.S. Representative
                    </span>
                </div>
            </div>
            <div className="hidden md:block">
                 <Button variant="primary">Follow Updates</Button>
            </div>
          </div>

          {/* Profile Info Grid */}
          {profile.officialWebsiteUrl || profile.phoneNumber ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
              {profile.officialWebsiteUrl && (
                <div>
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Official Website</div>
                  <a 
                    href={profile.officialWebsiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-[#2563EB] hover:underline"
                  >
                    Visit website →
                  </a>
                </div>
              )}
              {profile.phoneNumber && (
                <div>
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Contact</div>
                  <div className="text-[15px] text-[#111827]">
                    {profile.phoneNumber}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {/* BILLS SECTION (Full Width) */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Legislative Activity
        </h2>
        <SenatorBillsSection bioguideId={bioguideId} initial={legislation} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (70% - Data Heavy) */}
        <div className="lg:col-span-2 space-y-10">

           <FinancialOverview bioguideId={bioguideId} />
           <RecentTrades bioguideId={bioguideId} />
           <CongressHoldings bioguideId={bioguideId} />
           <LargestHoldings bioguideId={bioguideId} />

           <GovernmentContracts bioguideId={bioguideId} />

           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Corporate Donors
             </h2>
             <CorporateDonorsTable bioguideId={bioguideId} />
           </section>

           <CompanyMarketSignals bioguideId={bioguideId} />

           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Family Connections
             </h2>
             <FamilyTree bioguideId={bioguideId} memberName={profile.name} />
           </section>

           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Influence Network
             </h2>
             <ConnectionsPanel bioguideId={bioguideId} />
           </section>

        </div>

        {/* RIGHT COLUMN (30% - Context & News) */}
        <div className="space-y-10">
            
            {/* LATEST COVERAGE */}
            <section>
                <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                  Latest Coverage
                </h2>
                <OfficialNewsFeed
                    bioguideId={bioguideId}
                    defaultMode="aligned"
                />
            </section>

            {/* AFFILIATIONS */}
            <section>
                <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                  Affiliations
                </h2>
                <AffiliationsGrid bioguideId={bioguideId} />
            </section>

            {/* LATEST TWEETS */}
            <section>
                <MemberTweets bioguideId={bioguideId} />
            </section>

        </div>
      </div>

      {/* COMMUNITY DISCUSSION */}
      <section className="mt-12">
        <CommentSection
          entityType="politician"
          entityId={profile.bioguideId ?? bioguideId}
          title="Community Discussion"
        />
      </section>
    </main>
  )
}
