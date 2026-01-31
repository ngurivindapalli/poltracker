import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { senatorImageUrl } from '@/lib/images'

export const runtime = 'nodejs'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    const data = await fetchMember(bioguideId)
    const member = data?.member ?? data

    const name = member?.directOrderName ?? member?.name ?? member?.fullName
    const party = member?.currentParty ?? member?.partyName ?? member?.party
    const state = member?.state
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
