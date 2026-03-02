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
 * Returns hex color codes directly:
 * - Democrat majority → '#2563EB' (blue)
 * - Republican majority → '#DC2626' (red)
 * - Split delegation (1-1) → '#7C3AED' (purple)
 * - No data or other → '#9CA3AF' (gray)
 */
function getStateColor(senators: any[]): string {
  if (senators.length === 0) return '#9CA3AF'
  
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
  
  // Determine color based on majority - return hex colors directly
  if (demCount > repCount) return '#2563EB' // Blue for Democrat majority
  if (repCount > demCount) return '#DC2626' // Red for Republican majority
  if (demCount === repCount && demCount > 0) return '#7C3AED' // Purple for split delegation
  return '#9CA3AF' // Gray for no valid party data
}

export async function GET() {
  try {
    // Check for API key
    if (!process.env.API_DATA_GOV_KEY) {
      console.warn('Missing API_DATA_GOV_KEY - returning empty state colors')
      return NextResponse.json({}, { status: 200 })
    }

    // Fetch all current members
    const members = await fetchAllCurrentMembers()
    
    if (!Array.isArray(members)) {
      console.error('fetchAllCurrentMembers did not return an array:', typeof members)
      return NextResponse.json({}, { status: 200 })
    }
    
    // Filter to senators only
    const senators = members.filter(isSenator)
    
    // Group senators by state
    const senatorsByState: Record<string, any[]> = {}
    
    for (const senator of senators) {
      const state = senator?.state
      if (state && typeof state === 'string') {
        if (!senatorsByState[state]) {
          senatorsByState[state] = []
        }
        senatorsByState[state].push(senator)
      }
    }
    
    // Calculate color for each state - returns hex colors keyed by USPS state code
    const stateColors: Record<string, string> = {}
    
    for (const [stateCode, stateSenators] of Object.entries(senatorsByState)) {
      // Ensure state code is uppercase (USPS codes are uppercase)
      if (stateCode && typeof stateCode === 'string') {
        const normalizedStateCode = stateCode.toUpperCase()
        stateColors[normalizedStateCode] = getStateColor(stateSenators)
      }
    }
    
    // Ensure we always return a valid object
    const response = Object.keys(stateColors).length > 0 ? stateColors : {}
    
    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  } catch (err: any) {
    console.error('Error in state-colors route:', err)
    // Always return valid JSON, even on error
    return NextResponse.json({}, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      }
    })
  }
}
