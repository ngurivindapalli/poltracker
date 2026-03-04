import Link from 'next/link'
import { getBaseUrl } from '@/lib/baseUrl'
import NewsSection from '@/components/NewsSection'
import SenatorImage from '@/components/SenatorImage'
import ConnectionsPanel from '@/components/senator/ConnectionsPanel'
import InvestmentHistorySection from '@/components/senator/InvestmentHistorySection'
import FamilyTree from '@/components/FamilyTree'
import LobbyingTable from '@/components/senator/LobbyingTable'
import AffiliationsGrid from '@/components/senator/AffiliationsGrid'
import SenatorBillsSection from '@/components/senator/SenatorBillsSection'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

async function getJson(path: string) {
  try {
    const base = getBaseUrl()
    const res = await fetch(base + path, {
      cache: "no-store"
    })

    if (!res.ok) {
      console.error("API error", res.status, base + path)
      return null
    }

    return await res.json()
  } catch (e) {
    console.error("Fetch error:", path, e)
    return null
  }
}

export default async function SenatorPage({ params }: { params: { bioguideId: string } }) {
  const { bioguideId } = params

  const [senator, news] = await Promise.all([
    getJson(`/api/senator/${bioguideId}`),
    getJson(`/api/senator/${bioguideId}/news`).catch(() => null)
  ])

  if (!senator || !senator.profile) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <Card className="p-12 text-center bg-red-50 border-red-100">
          <h2 className="text-[20px] font-bold text-red-800 mb-2">
            Unable to load senator data right now.
          </h2>
          <p className="text-red-600">Please try again later.</p>
        </Card>
      </main>
    )
  }

  const profile = senator.profile
  const newsArticles = news?.articles ?? []
  const newsFailed = news === null

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
                        U.S. Senator
                    </span>
                </div>
            </div>
            <div className="hidden md:block">
                 <Button variant="primary">Follow Updates</Button>
            </div>
          </div>

          {/* Profile Info Grid */}
          {senator.member && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-[#F1F5F9]">
              {senator.member.officialWebsiteUrl && (
                <div>
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Official Website</div>
                  <a 
                    href={senator.member.officialWebsiteUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[15px] font-medium text-[#2563EB] hover:underline"
                  >
                    Visit website →
                  </a>
                </div>
              )}
              {(senator.member.addressInformation?.phoneNumber || senator.member.phoneNumber) && (
                <div>
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">Contact</div>
                  <div className="text-[15px] text-[#111827]">
                    {senator.member.addressInformation?.phoneNumber ?? senator.member.phoneNumber}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* BILLS SECTION (Full Width) */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Legislative Activity
        </h2>
        <SenatorBillsSection bioguideId={bioguideId} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN (70% - Data Heavy) */}
        <div className="lg:col-span-2 space-y-10">
           
           {/* INVESTMENT HISTORY & TRADING ACTIVITY */}
           <section>
             <InvestmentHistorySection senatorName={profile.name} />
           </section>

           {/* FAMILY TREE */}
           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Family Connections
             </h2>
             <FamilyTree senatorName={profile.name} />
           </section>

           {/* NETWORK GRAPH */}
           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Influence Network
             </h2>
             <ConnectionsPanel bioguideId={bioguideId} />
           </section>

           {/* LOBBYING TABLE (Added to main column for better table width) */}
           <section>
             <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
               Donor Influence
             </h2>
             <LobbyingTable bioguideId={bioguideId} />
           </section>

        </div>

        {/* RIGHT COLUMN (30% - Context & News) */}
        <div className="space-y-10">
            
            {/* LATEST COVERAGE */}
            <section>
                <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                  Latest Coverage
                </h2>
                {newsFailed ? (
                <Card className="p-6 bg-amber-50 border-amber-100 text-amber-800 text-center">
                    Unable to load recent news.
                </Card>
                ) : (
                <NewsSection
                    bioguideId={bioguideId}
                    initialArticles={newsArticles}
                    initialSourceType={news?.sourceType || 'major'}
                />
                )}
            </section>

            {/* AFFILIATIONS */}
            <section>
                <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
                  Affiliations
                </h2>
                <AffiliationsGrid bioguideId={bioguideId} />
            </section>

        </div>
      </div>
    </main>
  )
}
