import Link from 'next/link'
import { getBaseUrl } from '@/lib/baseUrl'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import StateElectionsSection from '@/components/state/StateElectionsSection'
import StateNewsSection from '@/components/state/StateNewsSection'
import CountySelector from '@/components/state/CountySelector'
import FederalOfficialsList from '@/components/state/FederalOfficialsList'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getCountiesForState, STATE_CODE_TO_NAME } from '@/lib/localData/usCounties'
import SenatorsList from '@/components/SenatorsList'

export const revalidate = 3600 // ISR: regenerate page every hour

export default async function StatePage({ params }: { params: { stateCode: string } }) {
  const state = params.stateCode.toUpperCase()
  const baseUrl = getBaseUrl()
  
  // Parallel fetch with caching
  const [senatorsRes, repsRes, stateDataRes] = await Promise.all([
    fetch(`${baseUrl}/api/senators`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    }),
    fetch(`${baseUrl}/api/representatives`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    }),
    fetch(`${baseUrl}/api/state/${state}`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    })
  ])

  const senatorsData = senatorsRes.ok ? await senatorsRes.json() : { senators: [] }
  const repsData = repsRes.ok ? await repsRes.json() : { representatives: [] }
  const stateData = stateDataRes.ok ? await stateDataRes.json() : null

  // Filter by state
  const stateSenators = (senatorsData.senators || []).filter((s: any) => s.state === state)
  const stateReps = (repsData.representatives || [])
    .filter((r: any) => r.state === state)
    .sort((a: any, b: any) => {
      const distA = typeof a.district === 'number' ? a.district : parseInt(a.district) || 999
      const distB = typeof b.district === 'number' ? b.district : parseInt(b.district) || 999
      return distA - distB
    })
  
  // Get counties for this state
  const counties = getCountiesForState(state)
  const { stateName, bills = {} } = stateData || {}
  const fullStateName = STATE_CODE_TO_NAME[state] || stateName || state

  if (stateData?.error) {
    return (
      <main className="max-w-[1000px] mx-auto px-6 py-12">
        <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <Card className="p-12 text-center bg-red-50 border-red-100">
          <h2 className="text-[20px] font-bold text-red-800 mb-2">
            {stateData?.error || 'Unable to load state data right now.'}
          </h2>
          <p className="text-red-600">Please try again later.</p>
        </Card>
      </main>
    )
  }

  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
      <Link href="/" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      <PageHeader 
        title={stateName || fullStateName} 
        subtitle="State Overview: Legislation, Elections, Local Government, and Political News"
        action={
          <Button variant="outline">
            Follow State Updates
          </Button>
        }
      />

      {/* Federal Officials Section */}
      <Section title="Federal Officials" subtitle="U.S. Senators and House Representatives">
        <FederalOfficialsList stateCode={state} />
      </Section>

      {/* County Selector Section */}
      {counties.length > 0 && (
        <Section title="Local Government" subtitle="Select a county to view local elections, events, and news">
          <CountySelector 
            stateCode={params.stateCode} 
            stateName={fullStateName} 
            counties={counties} 
          />
        </Section>
      )}

      {/* Senators Section */}
      {stateSenators.length > 0 && (
        <Section title="U.S. Senators" subtitle={`${stateSenators.length} Senator${stateSenators.length !== 1 ? 's' : ''} representing ${fullStateName}`}>
          <SenatorsList senators={stateSenators} />
        </Section>
      )}

      {/* House Representatives Section */}
      {stateReps.length > 0 && (
        <Section title="House Representatives" subtitle={`${stateReps.length} Representative${stateReps.length !== 1 ? 's' : ''} by district`}>
          <div className="grid grid-cols-3 gap-4">
            {stateReps.map((rep) => (
              <Link
                key={rep.bioguideId}
                href={`/representatives/${rep.bioguideId}`}
                className="block"
              >
                <Card className="p-4 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-md transition-all duration-200 h-full">
                  <div className="text-[12px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                    District {rep.district || 'At-Large'}
                  </div>
                  <div className="text-[15px] font-semibold text-[#1E3A5F] leading-tight">
                    {rep.name}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
           {/* Upcoming Elections */}
           <StateElectionsSection stateCode={params.stateCode} />

           {/* State Political News */}
           <StateNewsSection stateCode={params.stateCode} stateName={stateName || fullStateName} />
        </div>

        {/* Sidebar / Legislation */}
        <div className="space-y-8">
            <h2 className="text-[20px] font-bold text-[#1E3A5F] pb-4 border-b border-[#E2E8F0]">
              Recent Legislation
            </h2>

            {bills?.sponsored && bills.sponsored.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-[14px] font-semibold text-[#64748B] uppercase tracking-wide">
                    Sponsored Bills
                  </h3>
                  {bills.sponsored.slice(0, 5).map((bill: any, i: number) => (
                    <Card key={i} className="p-4 hover:border-[#2563EB] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="neutral" className="text-[10px]">{bill.code || 'BILL'}</Badge>
                        <span className="text-[10px] text-[#94A3B8]">{bill.date || 'Recent'}</span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-[#1E3A5F] leading-snug group-hover:text-[#2563EB] line-clamp-2">
                        {bill.title}
                      </h4>
                    </Card>
                  ))}
                </div>
            ) : null}

            {bills?.cosponsored && bills.cosponsored.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-[14px] font-semibold text-[#64748B] uppercase tracking-wide">
                    Cosponsored Bills
                  </h3>
                   {bills.cosponsored.slice(0, 3).map((bill: any, i: number) => (
                    <Card key={i} className="p-4 hover:border-[#2563EB] transition-colors cursor-pointer group">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="neutral" className="text-[10px]">{bill.code || 'BILL'}</Badge>
                        <span className="text-[10px] text-[#94A3B8]">{bill.date || 'Recent'}</span>
                      </div>
                      <h4 className="text-[14px] font-semibold text-[#1E3A5F] leading-snug group-hover:text-[#2563EB] line-clamp-2">
                        {bill.title}
                      </h4>
                    </Card>
                  ))}
                </div>
            ) : null}

            {(!bills?.sponsored?.length && !bills?.cosponsored?.length) && (
              <Card className="p-6 text-center text-[#64748B] italic bg-[#F8FAFC]">
                No recent legislation data available for {stateName || fullStateName}.
              </Card>
            )}
        </div>
      </div>
    </main>
  )
}
