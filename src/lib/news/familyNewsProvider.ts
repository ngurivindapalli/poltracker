/**
 * Family News Provider
 * Fetches news articles for family members and their organizations
 */

export interface FamilyNewsArticle {
  headline: string
  source: string
  url: string
  publishedAt: string
}

export interface FamilyMemberNews {
  id: string
  name: string
  relation: string
  occupation?: string
  organization?: string
  news: FamilyNewsArticle[]
  lastCheckedAt: string
}

/**
 * Fetch news for a family member
 */
export async function fetchFamilyNews(
  personName: string,
  relatedOrganizations?: string[]
): Promise<FamilyNewsArticle[]> {
  const apiKey = process.env.NEWS_API_KEY
  
  if (!apiKey) {
    console.warn('NEWS_API_KEY missing - returning empty news array')
    return []
  }

  try {
    // Build query: person name in quotes, optionally include organizations
    const nameQuery = `"${personName}"`
    const orgQueries = relatedOrganizations?.map(org => `"${org}"`).join(' OR ') || ''
    const query = orgQueries ? `${nameQuery} OR ${orgQueries}` : nameQuery

    // Calculate date 30 days ago
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const fromDate = thirtyDaysAgo.toISOString().split('T')[0]

    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&from=${fromDate}&pageSize=20&apiKey=${apiKey}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0 (contact: dev@poltracker.app)'
      }
    })

    if (!response.ok) {
      console.error(`NewsAPI error: ${response.status}`)
      return []
    }

    const data = await response.json()
    const articles = data.articles || []

    // Deduplicate by title (normalized)
    const seen = new Set<string>()
    const unique: FamilyNewsArticle[] = []

    for (const article of articles) {
      const normalizedTitle = (article.title || '')
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

      if (normalizedTitle && !seen.has(normalizedTitle) && article.url) {
        seen.add(normalizedTitle)
        unique.push({
          headline: article.title || '',
          source: article.source?.name || article.source || '',
          url: article.url,
          publishedAt: article.publishedAt || new Date().toISOString()
        })
      }
    }

    return unique
  } catch (error) {
    console.error('Error fetching family news:', error)
    return []
  }
}

/**
 * Fetch news for multiple family members
 */
export async function fetchFamilyMembersNews(
  familyMembers: Array<{
    name: string
    relation: string
    occupation?: string
    organization?: string
  }>
): Promise<FamilyMemberNews[]> {
  const results: FamilyMemberNews[] = []

  for (const member of familyMembers) {
    const relatedOrgs = member.organization ? [member.organization] : []
    const news = await fetchFamilyNews(member.name, relatedOrgs)

    results.push({
      id: `family-${member.name.toLowerCase().replace(/\s+/g, '-')}`,
      name: member.name,
      relation: member.relation,
      occupation: member.occupation,
      organization: member.organization,
      news,
      lastCheckedAt: new Date().toISOString()
    })
  }

  return results
}
