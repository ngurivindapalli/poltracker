import Link from 'next/link'
import { getBaseUrl } from '@/lib/getBaseUrl'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import StateElectionsSection from '@/components/state/StateElectionsSection'
import StateNewsSection from '@/components/state/StateNewsSection'
import CountySelector from '@/components/state/CountySelector'
import { Section } from '@/components/ui/Section'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { getCountiesForState, STATE_CODE_TO_NAME } from '@/lib/localData/usCounties'

async function getJson(path: string) {
  try {
    const base = getBaseUrl()
    const res = await fetch(base + path, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return await res.json()
  } catch (e) {
    console.error("Fetch error:", path, e)
    return null
  }
}

export default async function StatePage({ params }: { params: { stateCode: string } }) {
  const { stateCode } = params
  const stateData = await getJson(`/api/state/${stateCode.toUpperCase()}`)
  
  // Get counties for this state
  const counties = getCountiesForState(stateCode)
  const fullStateName = STATE_CODE_TO_NAME[stateCode.toUpperCase()] || stateData?.stateName || stateCode

  if (!stateData || stateData.error) {
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

  const { stateName, bills } = stateData

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

      {/* County Selector Section */}
      {counties.length > 0 && (
        <Section title="Local Government" subtitle="Select a county to view local elections, events, and news">
          <CountySelector 
            stateCode={stateCode} 
            stateName={fullStateName} 
            counties={counties} 
          />
        </Section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 mt-12">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-12">
           {/* Upcoming Elections */}
           <StateElectionsSection stateCode={stateCode} />

           {/* State Political News */}
           <StateNewsSection stateCode={stateCode} stateName={stateName || fullStateName} />
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
