export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { ideologyFromParty } from '@/lib/ideology'
import { domainsForMode } from '@/lib/newsSources'
import type { Ideology } from '@/lib/ideology'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const bioguideId = url.searchParams.get('bioguideId')
    const state = url.searchParams.get('state')
    const q = url.searchParams.get('q')
    const mode = (url.searchParams.get('mode') || 'aligned') as 'aligned' | 'balanced' | 'opposing'
    const party = url.searchParams.get('party')

    // Determine ideology
    let ideology: Ideology = 'center'
    
    if (bioguideId) {
      try {
        const memberData = await fetchMember(bioguideId)
        const member = memberData?.member ?? memberData
        
        // Extract party from member data
        let memberParty = member?.partyName ?? member?.party
        if (!memberParty) {
          const terms = (member?.terms?.item ?? member?.terms ?? []) as any[]
          const currentTerm = terms.find((t: any) => {
            const endYear = t?.endYear ?? t?.endDate
            return !endYear
          })
          memberParty = currentTerm?.partyName ?? currentTerm?.party
        }
        
        ideology = ideologyFromParty(memberParty)
      } catch (err) {
        console.error('Error fetching member for ideology:', err)
        // Fall back to party param or center
        ideology = party ? ideologyFromParty(party) : 'center'
      }
    } else if (party) {
      ideology = ideologyFromParty(party)
    }

    // Get domains for the selected mode
    const domains = domainsForMode(ideology, mode)

    // Build query terms
    let queryTerms = ''
    
    if (bioguideId) {
      try {
        const memberData = await fetchMember(bioguideId)
        const member = memberData?.member ?? memberData
        const fullName = member?.directOrderName ?? member?.name ?? member?.fullName
        const memberState = member?.state ?? state
        
        if (fullName) {
          queryTerms = `"${fullName}" ${memberState || state || ''}`
        } else if (state) {
          queryTerms = `${state} politics`
        } else if (q) {
          queryTerms = q
        } else {
          queryTerms = 'US politics'
        }
      } catch (err) {
        console.error('Error building query from member:', err)
        if (state) {
          queryTerms = `${state} politics`
        } else if (q) {
          queryTerms = q
        } else {
          queryTerms = 'US politics'
        }
      }
    } else if (state) {
      queryTerms = `${state} politics`
    } else if (q) {
      queryTerms = q
    } else {
      queryTerms = 'US politics'
    }

    // Check for NewsAPI key
    const apiKey = process.env.NEWS_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        ideology,
        mode,
        domains,
        articles: []
      })
    }

    // Build NewsAPI URL with domains parameter
    // NewsAPI supports domains parameter: domains=example.com,example.org
    const domainsParam = domains.join(',')
    const encodedQuery = encodeURIComponent(queryTerms.trim())
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=20&domains=${domainsParam}&apiKey=${apiKey}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      },
      next: { revalidate: 300 } // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('NewsAPI error:', response.status)
      return NextResponse.json({
        ideology,
        mode,
        domains,
        articles: []
      })
    }

    const data = await response.json()
    const rawArticles = data.articles || []

    // Process articles
    const articles = rawArticles
      .filter((article: any) => {
        if (!article.title || !article.title.trim()) return false
        if (!article.url) return false
        
        // Additional domain filtering (in case NewsAPI doesn't filter perfectly)
        const articleUrl = article.url.toLowerCase()
        const matchesDomain = domains.some(domain => 
          articleUrl.includes(domain.toLowerCase())
        )
        if (!matchesDomain) return false
        
        // Filter out opinion pieces and blogs
        if (articleUrl.includes('/opinion') || articleUrl.includes('/blog')) return false
        
        return true
      })
      .map((article: any) => ({
        title: article.title || '',
        description: article.description || '',
        url: article.url || '',
        source: article.source?.name || article.source || '',
        publishedAt: article.publishedAt || '',
        imageUrl: article.urlToImage || null
      }))
      .slice(0, 10) // Limit to 10 articles

    return NextResponse.json({
      ideology,
      mode,
      domains,
      articles
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
      }
    })

  } catch (err: any) {
    console.error('Error in official news API:', err)
    return NextResponse.json({
      ideology: 'center',
      mode: 'aligned',
      domains: [],
      articles: []
    }, { status: 500 })
  }
}
