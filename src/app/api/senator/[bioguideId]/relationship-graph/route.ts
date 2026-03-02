export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { buildRelationshipGraph } from '@/lib/graph/buildRelationshipGraph'
import { getFamilyResearchProfile, isProminent } from '@/lib/data/familyResearchProvider'
import { fetchMember, fetchMembersByState } from '@/lib/congress'

export async function GET(
  _req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId
    
    // Get senator data
    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData
    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName ?? ''
    const state = member?.state ?? senatorData?.state

    if (!fullName) {
      return NextResponse.json({
        relationship_graph: { nodes: [], edges: [] },
        bioguideId
      })
    }

    // Fetch family research data (with professional roles)
    const familyResearch = await getFamilyResearchProfile(fullName).catch(() => [])
    
    // Filter to only prominent family members
    const prominentFamily = familyResearch.filter(isProminent)

    // Get same-state senator (MANDATORY)
    let sameStateSenator: { name: string; bioguideId?: string; type: 'colleague' } | undefined
    if (state) {
      try {
        const stateMembers = await fetchMembersByState(state)
        const senators = stateMembers.filter((m: any) => {
          const terms = (m?.terms?.item ?? m?.terms ?? []) as any[]
          const isSenate = terms.some((t: any) => {
            const chamber = (t?.chamber ?? t?.chamberName ?? '').toString().toLowerCase()
            return chamber.includes('senate')
          })
          return isSenate && (m?.bioguideId ?? m?.bioguide_id ?? m?.id) !== bioguideId
        })
        
        if (senators.length > 0) {
          const otherSenator = senators[0]
          sameStateSenator = {
            name: otherSenator?.directOrderName ?? otherSenator?.name ?? otherSenator?.fullName ?? '',
            bioguideId: otherSenator?.bioguideId ?? otherSenator?.bioguide_id ?? otherSenator?.id,
            type: 'colleague'
          }
        }
      } catch (err) {
        console.error('Error fetching same-state senator:', err)
      }
    }

    // Build relationship graph (prominent family + colleague only)
    const relationship_graph = buildRelationshipGraph({
      senatorId: bioguideId,
      senatorName: fullName,
      senatorState: state || '',
      prominentFamily,
      sameStateSenator
    })

    return NextResponse.json({
      relationship_graph,
      bioguideId,
      senatorState: state
    })
  } catch (err: any) {
    console.error('Error building relationship graph:', err)
    return NextResponse.json({ 
      relationship_graph: { nodes: [], edges: [] },
      bioguideId: params.bioguideId,
      error: err?.message ?? 'Failed to build relationship graph'
    }, { status: 500 })
  }
}
