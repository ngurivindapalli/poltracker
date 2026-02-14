export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { senatorImageUrl } from '@/lib/images'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  // Check for API key before processing
  if (!process.env.API_DATA_GOV_KEY) {
    throw new Error('Missing API_DATA_GOV_KEY')
  }

  try {
    const bioguideId = params.bioguideId
    const data = await fetchMember(bioguideId)
    const member = data?.member ?? data

    const name = member?.directOrderName ?? member?.name ?? member?.fullName
    
    // Match the homepage logic exactly: partyName first, then party
    // Check both the member object and the top-level data object
    let party = member?.partyName ?? member?.party ?? data?.partyName ?? data?.party
    
    // If party not found, check all terms (the single member endpoint may store it in terms)
    if (!party) {
      const terms = (member?.terms?.item ?? member?.terms ?? data?.terms?.item ?? data?.terms ?? []) as any[]
      // Check current term first
      const currentTerm = terms.find((t: any) => {
        const endYear = t?.endYear ?? t?.endDate
        return !endYear // Current term has no end date
      })
      if (currentTerm) {
        party = currentTerm?.partyName ?? currentTerm?.party ?? party
      }
      // If still not found, check the most recent term
      if (!party && terms.length > 0) {
        const mostRecentTerm = terms[terms.length - 1]
        party = mostRecentTerm?.partyName ?? mostRecentTerm?.party ?? party
      }
    }
    
    const state = member?.state ?? data?.state
    const depiction = senatorImageUrl(bioguideId, '450x550')

    return NextResponse.json({
      member,
      profile: {
        bioguideId,
        name,
        party,
        state,
        imageUrl: depiction
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
