/**
 * Investments Data Provider
 * Supports future integration with:
 * - Senate EFD parser
 * - Quiver Quant API
 * 
 * Currently uses mock data from public/data/mockInvestments.json
 */

import { Investment } from '../types/senatorExtended'
import { getBaseUrl } from '../getBaseUrl'

export async function getSenatorInvestments(bioguideId: string): Promise<Investment[]> {
  // Future: Check for QUIVER_API_KEY and fetch live data
  // if (process.env.QUIVER_API_KEY) {
  //   return await fetchQuiverInvestments(bioguideId)
  // }

  // Future: Check for EFD parser availability
  // if (process.env.ENABLE_EFD_PARSER === 'true') {
  //   return await parseEFDDisclosure(bioguideId)
  // }

  // Fallback to mock data
  return getMockInvestments(bioguideId)
}

async function getMockInvestments(bioguideId: string): Promise<Investment[]> {
  try {
    const baseUrl = getBaseUrl()
    const res = await fetch(`${baseUrl}/data/mockInvestments.json`, {
      cache: 'no-store'
    })
    
    if (!res.ok) {
      console.error('Failed loading mock investments dataset')
      return []
    }
    
    const mockData = await res.json()
    console.log('Loaded Mock Investments')
    return mockData[bioguideId] || []
  } catch (error) {
    console.error('Error fetching mock investments:', error)
    return []
  }
}

// Future implementation stubs
// async function fetchQuiverInvestments(bioguideId: string): Promise<Investment[]> {
//   // Quiver Quant API integration
//   return []
// }

// async function parseEFDDisclosure(bioguideId: string): Promise<Investment[]> {
//   // Senate EFD parser integration
//   return []
// }
