export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSenatorAffiliations } from '@/lib/data/affiliationsProvider'
import { getSenatorInvestments } from '@/lib/data/investmentsProvider'
import { getSenatorDonors } from '@/lib/data/donorProvider'
import { fetchMember } from '@/lib/congress'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    
    // Get senator name
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''

    // Fetch related data in parallel
    const [investments, donorData] = await Promise.all([
      getSenatorInvestments(bioguideId),
      getSenatorDonors(bioguideId, fullName)
    ])

    const affiliations = await getSenatorAffiliations(
      bioguideId,
      fullName,
      investments,
      donorData.industry_breakdown
    )

    return NextResponse.json({
      affiliations,
      bioguideId
    })
  } catch (err: any) {
    console.error('Error fetching affiliations:', err)
    return NextResponse.json({ 
      affiliations: [],
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to fetch affiliations'
    }, { status: 500 })
  }
}
