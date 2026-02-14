export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchAllCurrentMembers } from '@/lib/congress'

/**
 * Determine if a member is a senator based on their terms or chamber
 */
function isSenator(m: any): boolean {
  const terms = (m?.terms?.item ?? m?.terms ?? []) as any[]
  for (const t of terms) {
    const chamber = (t?.chamber ?? t?.chamberName ?? t?.memberType ?? '').toString().toLowerCase()
    const isSenate = chamber.includes('senate')
    const endYear = t?.endYear ?? t?.endDate
    const isCurrent = !endYear
    if (isSenate && isCurrent) return true
  }

  const chamber2 = (m?.chamber ?? m?.currentChamber ?? '').toString().toLowerCase()
  return chamber2.includes('senate')
}

/**
 * Normalize party name to Democrat or Republican
 * Returns 'Democrat', 'Republican', or null
 */
function normalizeParty(party: string | undefined | null): 'Democrat' | 'Republican' | null {
  if (!party) return null
  const normalized = party.toLowerCase().trim()
  
  if (normalized.includes('democrat') || normalized === 'd') {
    return 'Democrat'
  }
  if (normalized.includes('republican') || normalized === 'r') {
    return 'Republican'
  }
  
  return null
}

/**
 * Determine state color based on Senate majority
 * - Democrat majority → 'blue'
 * - Republican majority → 'red'
 * - Split delegation (1-1) → 'purple'
 * - No data or other → 'gray'
 */
function getStateColor(senators: any[]): 'blue' | 'red' | 'purple' | 'gray' {
  if (senators.length === 0) return 'gray'
  
  let demCount = 0
  let repCount = 0
  
  for (const senator of senators) {
    // Extract party from member data (same logic as senator route)
    let party = senator?.partyName ?? senator?.party
    
    // If party not found, check terms
    if (!party) {
      const terms = (senator?.terms?.item ?? senator?.terms ?? []) as any[]
      const currentTerm = terms.find((t: any) => {
        const endYear = t?.endYear ?? t?.endDate
        return !endYear
      })
      if (currentTerm) {
        party = currentTerm?.partyName ?? currentTerm?.party ?? party
      }
      if (!party && terms.length > 0) {
        const mostRecentTerm = terms[terms.length - 1]
        party = mostRecentTerm?.partyName ?? mostRecentTerm?.party ?? party
      }
    }
    
    const normalized = normalizeParty(party)
    if (normalized === 'Democrat') demCount++
    else if (normalized === 'Republican') repCount++
  }
  
  // Determine color based on majority
  if (demCount > repCount) return 'blue'
  if (repCount > demCount) return 'red'
  if (demCount === repCount && demCount > 0) return 'purple' // Split delegation
  return 'gray' // No valid party data
}

export async function GET() {
  try {
    // Check for API key
    if (!process.env.API_DATA_GOV_KEY) {
      return NextResponse.json(
        { error: 'Missing API_DATA_GOV_KEY' },
        { status: 500 }
      )
    }

    // Fetch all current members
    const members = await fetchAllCurrentMembers()
    
    // Filter to senators only
    const senators = members.filter(isSenator)
    
    // Group senators by state
    const senatorsByState: Record<string, any[]> = {}
    
    for (const senator of senators) {
      const state = senator?.state
      if (state) {
        if (!senatorsByState[state]) {
          senatorsByState[state] = []
        }
        senatorsByState[state].push(senator)
      }
    }
    
    // Calculate color for each state
    const stateColors: Record<string, 'blue' | 'red' | 'purple' | 'gray'> = {}
    
    for (const [stateCode, stateSenators] of Object.entries(senatorsByState)) {
      stateColors[stateCode] = getStateColor(stateSenators)
    }
    
    return NextResponse.json(stateColors)
  } catch (err: any) {
    console.error('Error in state-colors route:', err)
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
