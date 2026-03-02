/**
 * UK Bills Provider
 * Fetches sponsored bills for UK Parliament members
 */

export interface UKBill {
  id: string
  title: string
  introducedDate: string
  currentStage: string
}

/**
 * Get bills sponsored by an MP
 */
export async function getMPBills(mpId: number): Promise<UKBill[]> {
  try {
    const response = await fetch(
      `https://bills-api.parliament.uk/api/v1/Bills?MemberId=${mpId}`,
      {
        headers: {
          'User-Agent': 'PolTracker/1.0'
        }
      }
    )

    if (!response.ok) {
      console.error('UK Bills API error:', response.status)
      return []
    }

    const data = await response.json()

    if (!data.items || !Array.isArray(data.items)) {
      return []
    }

    return data.items.map((item: any) => ({
      id: item.id?.toString() || '',
      title: item.shortTitle || item.title || 'Untitled Bill',
      introducedDate: item.introducedDate || new Date().toISOString(),
      currentStage: item.currentStage?.name || item.stage || 'Unknown'
    })).filter((bill: UKBill) => bill.id && bill.title)
  } catch (error) {
    console.error('Error fetching UK bills:', error)
    return []
  }
}
