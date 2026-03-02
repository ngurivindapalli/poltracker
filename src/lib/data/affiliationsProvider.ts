/**
 * Affiliations Provider
 * Combines data from:
 * - Wikidata (positions held)
 * - Investment-related board positions
 * - Donor industry ties
 */

import { Affiliation } from '../types/senatorExtended'
import { Investment } from '../types/senatorExtended'
import { IndustryExposure } from '../types/senatorExtended'

export async function getSenatorAffiliations(
  bioguideId: string,
  fullName: string,
  investments: Investment[],
  industryExposure: IndustryExposure[]
): Promise<Affiliation[]> {
  const affiliations: Affiliation[] = []

  // Get Wikidata positions
  const wikidataAffiliations = await getWikidataAffiliations(fullName)
  affiliations.push(...wikidataAffiliations)

  // Extract board positions from investments
  const boardPositions = extractBoardPositions(investments)
  affiliations.push(...boardPositions)

  // Extract industry committee affiliations from donor data
  const industryAffiliations = extractIndustryAffiliations(industryExposure)
  affiliations.push(...industryAffiliations)

  // Deduplicate by organization name
  return deduplicateAffiliations(affiliations)
}

async function getWikidataAffiliations(fullName: string): Promise<Affiliation[]> {
  // Simplified - would use full Wikidata SPARQL query
  // For now, return empty array
  // Future: Query for positions held, board memberships, etc.
  return []
}

function extractBoardPositions(investments: Investment[]): Affiliation[] {
  const affiliations: Affiliation[] = []
  
  // If senator holds significant stock in a company, they might be on the board
  // This is a simplified heuristic - real implementation would cross-reference
  investments.forEach((inv) => {
    if (inv.asset_type === 'stock' && inv.value_range.min > 100000) {
      const companyName = inv.asset_name.replace(/\s*\([^)]*\)\s*$/, '') // Remove ticker
      affiliations.push({
        organization: companyName,
        type: 'Board',
        role: 'Potential Board Member',
        source: 'Investment Analysis'
      })
    }
  })

  return affiliations
}

function extractIndustryAffiliations(industryExposure: IndustryExposure[]): Affiliation[] {
  const affiliations: Affiliation[] = []
  
  // High industry exposure might indicate committee membership
  industryExposure.forEach((industry) => {
    if (industry.percent_of_total > 10) {
      affiliations.push({
        organization: `${industry.industry} Committee`,
        type: 'Committee',
        role: 'Potential Member',
        source: 'Donor Analysis'
      })
    }
  })

  return affiliations
}

function deduplicateAffiliations(affiliations: Affiliation[]): Affiliation[] {
  const seen = new Set<string>()
  const unique: Affiliation[] = []

  affiliations.forEach((aff) => {
    const key = `${aff.organization.toLowerCase()}-${aff.type}`
    if (!seen.has(key)) {
      seen.add(key)
      unique.push(aff)
    }
  })

  return unique
}
