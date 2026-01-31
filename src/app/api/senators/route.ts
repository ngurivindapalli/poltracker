import { NextResponse } from 'next/server'
import { fetchAllCurrentMembers } from '@/lib/congress'
import { senatorImageUrl } from '@/lib/images'

export const runtime = 'nodejs'

function toSenateOnly(m: any): boolean {
  // The Congress.gov member payload includes terms with chamber info.
  // We consider a member a senator if any current term is in the Senate.
  const terms = (m?.terms?.item ?? m?.terms ?? []) as any[]
  for (const t of terms) {
    const chamber = (t?.chamber ?? t?.chamberName ?? t?.memberType ?? '').toString().toLowerCase()
    const isSenate = chamber.includes('senate')
    const endYear = t?.endYear ?? t?.endDate
    const isCurrent = endYear ? false : true
    if (isSenate && isCurrent) return true
  }

  // Fallback: sometimes the data includes a current chamber / bio line
  const chamber2 = (m?.chamber ?? m?.currentChamber ?? '').toString().toLowerCase()
  return chamber2.includes('senate')
}

export async function GET() {
  try {
    const members = await fetchAllCurrentMembers()
    const senators = members
      .filter(toSenateOnly)
      .map((m) => {
        const bioguideId = m?.bioguideId ?? m?.bioguide_id ?? m?.id
        const name = m?.name ?? `${m?.firstName ?? ''} ${m?.lastName ?? ''}`.trim()
        const party = m?.partyName ?? m?.party
        const state = m?.state
        return {
          bioguideId,
          name,
          party,
          state,
          imageUrl: senatorImageUrl(bioguideId)
        }
      })
      .filter((s) => s.bioguideId && s.name)
      .sort((a, b) => a.name.localeCompare(b.name))

    return NextResponse.json({ senators })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? String(err) }, { status: 500 })
  }
}
