export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getFamilyResearchProfile } from '@/lib/data/familyResearchProvider'
import { fetchMember } from '@/lib/congress'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId

    // Get senator data to get name
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''

    if (!fullName) {
      return NextResponse.json({
        familyMembers: [],
        bioguideId
      })
    }

    // Fetch family research profile
    const familyMembers = await getFamilyResearchProfile(fullName)

    return NextResponse.json({
      familyMembers,
      bioguideId
    })
  } catch (err: any) {
    console.error('Error fetching family research profile:', err)
    return NextResponse.json({
      familyMembers: [],
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to fetch family research profile'
    }, { status: 500 })
  }
}
