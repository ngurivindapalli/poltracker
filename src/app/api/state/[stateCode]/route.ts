export const runtime = 'nodejs'
export const revalidate = 3600 // Cache for 1 hour

import { NextResponse } from 'next/server'
import { fetchMembersByState, fetchSponsoredLegislation, fetchCosponsoredLegislation } from '@/lib/congress'
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  getArticleSourceKey
} from '@/lib/newsSources'

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

/**
 * Fetch news articles for a state
 * Uses member names + state name as search query
 */
async function fetchStateNews(stateCode: string, memberNames: string[], allowedSourceIds: string[]): Promise<any[]> {
  if (!process.env.NEWS_API_KEY) {
    console.error('NEWS_API_KEY missing for state news')
    return []
  }

  const stateName = STATE_NAMES[stateCode] || stateCode
  const allow = new Set(allowedSourceIds.map((x) => x.toLowerCase()))
  
  // Build query: state name + member names (limit to first 5 to avoid query length issues)
  const nameQueries = memberNames.slice(0, 5).map(name => `"${name}"`).join(' OR ')
  const query = encodeURIComponent(`${stateName} politics ${nameQueries}`)
  
  const sourcesParam = `&sources=${encodeURIComponent(buildNewsApiSourcesQueryParam(allowedSourceIds))}`
  const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=30&apiKey=${process.env.NEWS_API_KEY}${sourcesParam}`

  try {
    const response = await fetch(newsApiUrl, {
      headers: { 'User-Agent': 'PolTracker/1.0' },
      next: { revalidate: 3600 }
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
      
      // Must have title and be from selected sources
      if (!article.title || !article.title.trim()) return false
      const key = getArticleSourceKey(article.source)
      return !!key && allow.has(key)
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
    }).slice(0, 6) // Limit to 6 articles for fast load
  } catch (err) {
    console.error('Error fetching state news:', err)
    return []
  }
}

/**
 * Aggregate bills from all members in a state (parallel fetch)
 */
async function aggregateStateBills(members: any[]): Promise<{ sponsored: any[], cosponsored: any[] }> {
  const memberSlice = members.slice(0, 5)
  const results = await Promise.all(
    memberSlice.map(async (member) => {
      const bioguideId = member?.bioguideId ?? member?.bioguide_id ?? member?.id
      if (!bioguideId) return { sponsored: [], cosponsored: [] }
      try {
        const [sponsoredData, cosponsoredData] = await Promise.all([
          fetchSponsoredLegislation(bioguideId, 10),
          fetchCosponsoredLegislation(bioguideId, 10)
        ])
        const sponsored = sponsoredData?.bills?.item ?? sponsoredData?.bills ?? []
        const cosponsored = cosponsoredData?.bills?.item ?? cosponsoredData?.bills ?? []
        return { sponsored, cosponsored }
      } catch (err) {
        console.error(`Error fetching bills for member ${bioguideId}:`, err)
        return { sponsored: [], cosponsored: [] }
      }
    })
  )

  const seenBills = new Set<string>()
  const allSponsored: any[] = []
  const allCosponsored: any[] = []

  for (const { sponsored, cosponsored } of results) {
    for (const bill of sponsored) {
      const billKey = `${bill.congress}-${bill.type}-${bill.number}`
      if (!seenBills.has(billKey)) {
        seenBills.add(billKey)
        allSponsored.push(bill)
      }
    }
    for (const bill of cosponsored) {
      const billKey = `${bill.congress}-${bill.type}-${bill.number}`
      if (!seenBills.has(billKey)) {
        seenBills.add(billKey)
        allCosponsored.push(bill)
      }
    }
  }

  const sortByDate = (a: any, b: any) => {
    const dateA = a.introducedDate ? new Date(a.introducedDate).getTime() : 0
    const dateB = b.introducedDate ? new Date(b.introducedDate).getTime() : 0
    return dateB - dateA
  }

  return {
    sponsored: allSponsored.sort(sortByDate).slice(0, 5),
    cosponsored: allCosponsored.sort(sortByDate).slice(0, 5)
  }
}

export async function GET(
  req: Request,
  { params }: { params: { stateCode: string } }
) {
  try {
    const stateCode = params.stateCode.toUpperCase()
    const urlObj = new URL(req.url)
    const { ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)
    
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
      fetchStateNews(stateCode, memberNames, sourceIds),
      aggregateStateBills(members)
    ])

    // Log results for debugging
    console.log(`State ${stateCode}: ${news.length} news articles, ${bills.sponsored.length} sponsored bills, ${bills.cosponsored.length} cosponsored bills`)

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
      news: news.slice(0, 6),
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
