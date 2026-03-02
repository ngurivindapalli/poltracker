/**
 * UK Activity Provider
 * Fetches parliamentary contributions and activity for UK MPs
 */

export interface UKContribution {
  title: string
  date: string
}

/**
 * Get recent parliamentary contributions for an MP
 */
export async function getMPContributions(mpId: number): Promise<UKContribution[]> {
  console.log("Fetching contributions for MP ID:", mpId);
  try {
    const res = await fetch(
      `https://members-api.parliament.uk/api/Members/${mpId}/Contributions`,
      {
        headers: {
          'User-Agent': 'PolTracker/1.0'
        }
      }
    )

    if (!res.ok) {
      return []
    }

    const data = await res.json()

    if (!data.items) {
      return []
    }

    const unique = new Map<string, UKContribution>()

    data.items.forEach((item: any) => {
      const title = item.value?.debateTitle || item.debateTitle
      const date = item.value?.sittingDate || item.sittingDate
      
      if (title && !unique.has(title)) {
        unique.set(title, {
          title,
          date: date || new Date().toISOString()
        })
      }
    })

    return Array.from(unique.values())
      .sort((a: any, b: any) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      )
      .slice(0, 5)
  } catch (error) {
    console.error('Error fetching UK contributions:', error)
    return []
  }
}
