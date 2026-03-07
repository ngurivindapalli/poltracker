import { fetchSponsoredLegislation } from "@/lib/congress"

export interface Bill {
  billId: string
  title: string
  introducedDate: string
  summary?: string
  url?: string
}

/**
 * Get the latest bills for an official
 * Strategy:
 * 1. Try Congress.gov API (via fetchSponsoredLegislation)
 * 2. Fallback to empty array if unavailable
 */
export async function getLatestBillsForOfficial(
  bioguideId: string,
  limit: number = 5
): Promise<Bill[]> {
  try {
    // Use existing Congress.gov API helper
    const data = await fetchSponsoredLegislation(bioguideId, limit)
    
    // Handle different response structures
    const bills = data?.sponsoredLegislation || 
                  data?.bills?.item || 
                  data?.bills || 
                  []

    if (!Array.isArray(bills) || bills.length === 0) {
      return []
    }

    // Normalize bills to our format
    const normalized: Bill[] = bills
      .filter((bill: any) => {
        // Must have at least a title or number
        return (bill.title || bill.titles?.[0]?.title || bill.number) && 
               (bill.introducedDate || bill.updateDate)
      })
      .map((bill: any) => {
        const billNumber = bill.number || ''
        const billType = bill.type || ''
        const congress = bill.congress || '118' // Default to current congress
        
        // Extract title
        const title = bill.titles?.[0]?.title || 
                     bill.title || 
                     `${billType.toUpperCase()} ${billNumber}`

        // Extract introduced date
        const introducedDate = bill.introducedDate || 
                               bill.updateDate || 
                               new Date().toISOString()

        // Build URL to Congress.gov
        const url = `https://www.congress.gov/bill/${congress}th-congress/${billType}/${billNumber}`

        // Extract summary if available
        const summary = bill.summary?.text || 
                       bill.latestAction?.text || 
                       undefined

        return {
          billId: `${congress}-${billType}-${billNumber}`,
          title,
          introducedDate,
          summary,
          url
        }
      })
      .sort((a, b) => {
        // Sort by date (newest first)
        const dateA = new Date(a.introducedDate).getTime()
        const dateB = new Date(b.introducedDate).getTime()
        return dateB - dateA
      })
      .slice(0, limit)

    return normalized
  } catch (err) {
    console.error(`Error fetching bills for ${bioguideId}:`, err)
    return []
  }
}
