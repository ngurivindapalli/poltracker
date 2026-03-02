/**
 * UK News Index Provider
 * Lightweight news index for sorting MPs by recent media mentions
 */

interface UKMember {
  id: number
  name: string
  party: string | null
  constituency: string | null
  thumbnail?: string
  latestNewsDate?: number
}

/**
 * Enrich members with latest news dates for sorting
 * Only processes first 50 members to stay within API quota
 */
export async function getUKNewsIndex(members: UKMember[]): Promise<UKMember[]> {
  if (!process.env.NEWS_API_KEY) {
    return members
  }

  const updatedMembers = await Promise.all(
    members.slice(0, 50).map(async (m) => {
      try {
        const query = encodeURIComponent(`"${m.name}" AND MP`)
        const res = await fetch(
          `https://gnews.io/api/v4/search?q=${query}&country=gb&max=1&apikey=${process.env.NEWS_API_KEY}`,
          {
            headers: {
              'User-Agent': 'PolTracker/1.0'
            }
          }
        )

        if (!res.ok) {
          return m
        }

        const data = await res.json()

        return {
          ...m,
          latestNewsDate: data.articles?.[0]?.publishedAt
            ? new Date(data.articles[0].publishedAt).getTime()
            : 0
        }
      } catch (error) {
        console.error(`Error fetching news for ${m.name}:`, error)
        return m
      }
    })
  )

  return [
    ...updatedMembers,
    ...members.slice(50)
  ]
}
