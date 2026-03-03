/**
 * Investments Data Provider
 * Uses local STOCK Act data from public/data/senateTrades.json
 */

import { Investment } from '../types/senatorExtended'
import { getBaseUrl } from '../getBaseUrl'

export async function getSenatorInvestments(bioguideId: string): Promise<Investment[]> {
  // This function is deprecated - use /api/investments/[name] instead
  // which reads from public/data/senateTrades.json
  return []
}
