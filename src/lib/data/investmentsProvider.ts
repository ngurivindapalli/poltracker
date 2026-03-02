/**
 * Investments Data Provider
 * Supports future integration with:
 * - Senate EFD parser
 * - Quiver Quant API
 * 
 * Currently uses mock data from data/mockInvestments.json
 */

import fs from 'fs'
import path from 'path'
import { Investment } from '../types/senatorExtended'

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

function getMockInvestments(bioguideId: string): Investment[] {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'mockInvestments.json')
    const fileContent = fs.readFileSync(dataPath, 'utf-8')
    const mockData = JSON.parse(fileContent)
    return mockData[bioguideId] || []
  } catch (error) {
    console.error('Error reading mock investments:', error)
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
