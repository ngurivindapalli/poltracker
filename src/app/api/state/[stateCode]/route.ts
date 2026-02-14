export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMembersByState, fetchSponsoredLegislation, fetchCosponsoredLegislation } from '@/lib/congress'

// State code to full name mapping
const STATE_NAMES: Record<string, string> = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas',
  CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware',
  FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho',
  IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas',
  KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland',
  MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi',
  MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada',
  NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York',
  NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma',
  OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina',
  SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah',
  VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia',
  WI: 'Wisconsin', WY: 'Wyoming', DC: 'District of Columbia'
}

// Major news sources allowlist (reused from senator news route)
const MAJOR_NEWS_SOURCES = [
  'reuters', 'associated-press', 'bbc-news', 'cnn', 'fox-news',
  'nbc-news', 'abc-news', 'cbs-news', 'the-new-york-times',
  'the-washington-post', 'the-wall-street-journal', 'politico',
  'axios', 'bloomberg', 'usa-today', 'al-jazeera-english', 'the-guardian-uk'
]

/**
 * Fetch news articles for a state
 * Uses member names + state name as search query
 */
async function fetchStateNews(stateCode: string, memberNames: string[]): Promise<any[]> {
  if (!process.env.NEWS_API_KEY) {
    console.error('NEWS_API_KEY missing for state news')
    return []
  }

  const stateName = STATE_NAMES[stateCode] || stateCode
  
  // Build query: state name + member names (limit to first 5 to avoid query length issues)
  const nameQueries = memberNames.slice(0, 5).map(name => `"${name}"`).join(' OR ')
  const query = encodeURIComponent(`${stateName} politics ${nameQueries}`)
  
  const sourcesParam = `&sources=${MAJOR_NEWS_SOURCES.join(',')}`
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEWS_API_KEY}${sourcesParam}`

  try {
    const response = await fetch(newsApiUrl, {
      headers: { 'User-Agent': 'PolTracker/1.0' }
    })

    if (!response.ok) {
      console.error(`NewsAPI error for state ${stateCode}: ${response.status}`)
      return []
    }

    const data = await response.json()
    const articles = (data.articles || []).filter((article: any) => {
      // Filter out opinion pieces and blogs
      const url = (article.url || '').toLowerCase()
      if (url.includes('opinion') || url.includes('/blog')) return false
      
      // Must have title and be from major source
      if (!article.title || !article.title.trim()) return false
      const sourceId = (article.source?.id || article.source?.name || '').toLowerCase().replace(/\s+/g, '-')
      return MAJOR_NEWS_SOURCES.includes(sourceId)
    }).map((article: any) => ({
      title: article.title || '',
      description: article.description || '',
      url: article.url || '',
      source: article.source?.name || article.source || '',
      publishedAt: article.publishedAt || ''
    }))

    // Deduplicate by title
    const seen = new Set<string>()
    return articles.filter((article: any) => {
      const normalized = article.title.toLowerCase().replace(/[^\w\s]/g, '').trim()
      if (seen.has(normalized)) return false
      seen.add(normalized)
      return true
    }).slice(0, 20) // Limit to 20 articles
  } catch (err) {
    console.error('Error fetching state news:', err)
    return []
  }
}

/**
 * Aggregate bills from all members in a state
 */
async function aggregateStateBills(members: any[]): Promise<{ sponsored: any[], cosponsored: any[] }> {
  const allSponsored: any[] = []
  const allCosponsored: any[] = []
  const seenBills = new Set<string>()

  // Fetch bills for each member (limit to first 10 members to avoid rate limits)
  for (const member of members.slice(0, 10)) {
    const bioguideId = member?.bioguideId ?? member?.bioguide_id ?? member?.id
    if (!bioguideId) continue

    try {
      // Fetch sponsored bills
      const sponsoredData = await fetchSponsoredLegislation(bioguideId, 10)
      const sponsored = sponsoredData?.bills?.item ?? sponsoredData?.bills ?? []
      
      for (const bill of sponsored) {
        const billKey = `${bill.congress}-${bill.type}-${bill.number}`
        if (!seenBills.has(billKey)) {
          seenBills.add(billKey)
          allSponsored.push(bill)
        }
      }

      // Fetch cosponsored bills
      const cosponsoredData = await fetchCosponsoredLegislation(bioguideId, 10)
      const cosponsored = cosponsoredData?.bills?.item ?? cosponsoredData?.bills ?? []
      
      for (const bill of cosponsored) {
        const billKey = `${bill.congress}-${bill.type}-${bill.number}`
        if (!seenBills.has(billKey)) {
          seenBills.add(billKey)
          allCosponsored.push(bill)
        }
      }
    } catch (err) {
      console.error(`Error fetching bills for member ${bioguideId}:`, err)
      // Continue with other members
    }
  }

  // Sort by introduced date (newest first)
  const sortByDate = (a: any, b: any) => {
    const dateA = a.introducedDate ? new Date(a.introducedDate).getTime() : 0
    const dateB = b.introducedDate ? new Date(b.introducedDate).getTime() : 0
    return dateB - dateA
  }

  return {
    sponsored: allSponsored.sort(sortByDate).slice(0, 20),
    cosponsored: allCosponsored.sort(sortByDate).slice(0, 20)
  }
}

export async function GET(
  _req: Request,
  { params }: { params: { stateCode: string } }
) {
  try {
    const stateCode = params.stateCode.toUpperCase()
    
    if (!STATE_NAMES[stateCode]) {
      return NextResponse.json(
        { error: `Invalid state code: ${stateCode}` },
        { status: 400 }
      )
    }

    // Check for API key
    if (!process.env.API_DATA_GOV_KEY) {
      return NextResponse.json(
        { error: 'Missing API_DATA_GOV_KEY' },
        { status: 500 }
      )
    }

    // Fetch all members from this state
    const members = await fetchMembersByState(stateCode)
    
    if (members.length === 0) {
      return NextResponse.json({
        stateCode,
        stateName: STATE_NAMES[stateCode],
        members: [],
        news: [],
        bills: { sponsored: [], cosponsored: [] }
      })
    }

    // Extract member names for news query
    const memberNames = members
      .map(m => m?.directOrderName ?? m?.name ?? m?.fullName)
      .filter(Boolean)
      .slice(0, 10) // Limit to avoid query length issues

    // Fetch news and bills in parallel
    const [news, bills] = await Promise.all([
      fetchStateNews(stateCode, memberNames),
      aggregateStateBills(members)
    ])

    return NextResponse.json({
      stateCode,
      stateName: STATE_NAMES[stateCode],
      members: members.map(m => ({
        bioguideId: m?.bioguideId ?? m?.bioguide_id ?? m?.id,
        name: m?.directOrderName ?? m?.name ?? m?.fullName,
        party: m?.partyName ?? m?.party,
        state: m?.state,
        chamber: m?.chamber ?? m?.chamberName
      })),
      news,
      bills
    })
  } catch (err: any) {
    console.error('Error in state route:', err)
    return NextResponse.json(
      { error: err?.message ?? String(err) },
      { status: 500 }
    )
  }
}
