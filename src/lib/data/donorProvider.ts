/**
 * Donor & Industry Exposure Data Provider
 * Integrates with:
 * - OpenSecrets API (primary)
 * - FEC API (fallback)
 */

import { Donor, IndustryExposure } from '../types/senatorExtended'

interface OpenSecretsResponse {
  response: {
    candcontrib: {
      contributor: Array<{
        '@attributes': {
          org_name: string
          total: string
          cycle: string
          pacs: string
        }
      }>
    }
    candindustry: {
      industry: Array<{
        '@attributes': {
          industry_code: string
          industry_name: string
          total: string
          indivs: string
          pacs: string
        }
      }>
    }
  }
}

export interface DonorData {
  top_donors: Donor[]
  industry_breakdown: IndustryExposure[]
}

export async function getSenatorDonors(bioguideId: string, fullName: string): Promise<DonorData> {
  // Try OpenSecrets first
  if (process.env.OPEN_SECRETS_KEY) {
    try {
      const data = await fetchOpenSecretsData(bioguideId, fullName)
      if (data) return data
    } catch (error) {
      console.error('OpenSecrets API error:', error)
    }
  }

  // Fallback to FEC
  if (process.env.FEC_API_KEY) {
    try {
      const data = await fetchFECData(bioguideId, fullName)
      if (data) return data
    } catch (error) {
      console.error('FEC API error:', error)
    }
  }

  // Return empty structure if no API keys
  return {
    top_donors: [],
    industry_breakdown: []
  }
}

async function fetchOpenSecretsData(bioguideId: string, fullName: string): Promise<DonorData | null> {
  const apiKey = process.env.OPEN_SECRETS_KEY
  if (!apiKey) return null

  try {
    // OpenSecrets API requires CID (Candidate ID), not bioguideId
    // For now, return null - would need CID mapping
    // const cid = await getCIDFromBioguideId(bioguideId)
    // const url = `https://www.opensecrets.org/api/?method=candContrib&cid=${cid}&cycle=2024&apikey=${apiKey}&output=json`
    
    // Placeholder - would implement full integration
    return null
  } catch (error) {
    console.error('OpenSecrets fetch error:', error)
    return null
  }
}

async function fetchFECData(bioguideId: string, fullName: string): Promise<DonorData | null> {
  const apiKey = process.env.FEC_API_KEY
  if (!apiKey) return null

  try {
    // FEC API integration
    // Would need to map bioguideId to FEC candidate ID
    // const url = `https://api.open.fec.gov/v1/candidates/${fecId}/totals/?api_key=${apiKey}`
    
    // Placeholder - would implement full integration
    return null
  } catch (error) {
    console.error('FEC fetch error:', error)
    return null
  }
}
