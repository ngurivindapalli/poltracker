export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSenatorDonors } from '@/lib/data/donorProvider'
import { fetchMember } from '@/lib/congress'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    
    // Get senator name for donor lookup
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''

    const donorData = await getSenatorDonors(bioguideId, fullName)

    return NextResponse.json({
      ...donorData,
      bioguideId
    })
  } catch (err: any) {
    console.error('Error fetching donors:', err)
    return NextResponse.json({ 
      top_donors: [],
      industry_breakdown: [],
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to fetch donor data'
    }, { status: 500 })
  }
}
