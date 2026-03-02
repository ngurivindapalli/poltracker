export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getSenatorFamily } from '@/lib/data/wikidataProvider'
import { fetchMember } from '@/lib/congress'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    
    // Get senator name for Wikidata lookup
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''

    if (!fullName) {
      return NextResponse.json({
        family: [],
        bioguideId
      })
    }

    const family = await getSenatorFamily(fullName)

    return NextResponse.json({
      family,
      bioguideId
    })
  } catch (err: any) {
    console.error('Error fetching family data:', err)
    return NextResponse.json({ 
      family: [],
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to fetch family data'
    }, { status: 500 })
  }
}
