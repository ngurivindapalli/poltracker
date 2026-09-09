export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { ideologyFromParty } from '@/lib/ideology'
import { domainsForMode } from '@/lib/newsSources'
import type { Ideology } from '@/lib/ideology'
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds
} from '@/lib/newsSources'

function emptyPayload(ideology: Ideology, mode: string, domains: string[]) {
  return {
    ideology,
    mode,
    domains,
    articles: [] as unknown[]
  }
}

export async function GET(req: Request) {
  let ideology: Ideology = 'center'
  let mode: 'aligned' | 'balanced' | 'opposing' = 'aligned'
  let domains: string[] = []

  try {
    const url = new URL(req.url)
    const bioguideId = url.searchParams.get('bioguideId')
    const state = url.searchParams.get('state')
    const q = url.searchParams.get('q')
    const requestedMode = url.searchParams.get('mode')
    if (requestedMode === 'balanced' || requestedMode === 'opposing' || requestedMode === 'aligned') {
      mode = requestedMode
    }
    const party = url.searchParams.get('party')
    const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)

    let member: any = null
    if (bioguideId) {
      try {
        const memberData = await fetchMember(bioguideId)
        member = memberData?.member ?? memberData
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
      } catch {
        ideology = party ? ideologyFromParty(party) : 'center'
      }
    } else if (party) {
      ideology = ideologyFromParty(party)
    }

    domains = domainsForMode(ideology, mode)

    let queryTerms = 'US politics'
    if (member) {
      const fullName = member?.directOrderName ?? member?.name ?? member?.fullName
      const memberState = member?.state ?? state
      if (fullName) {
        queryTerms = `"${fullName}" ${memberState || state || ''}`.trim()
      } else if (state) {
        queryTerms = `${state} politics`
      } else if (q) {
        queryTerms = q
      }
    } else if (state) {
      queryTerms = `${state} politics`
    } else if (q) {
      queryTerms = q
    }

    const apiKey = process.env.NEWS_API_KEY
    if (!apiKey) {
      return NextResponse.json(emptyPayload(ideology, mode, domains))
    }

    const encodedQuery = encodeURIComponent(queryTerms.trim())
    const useExplicitSources = paramPresent
    const sourcesQueryValue = buildNewsApiSourcesQueryParam(sourceIds)

    let newsApiUrl: string
    if (useExplicitSources) {
      newsApiUrl = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=20&sources=${encodeURIComponent(
        sourcesQueryValue
      )}&apiKey=${apiKey}`
    } else {
      const domainsParam = domains.join(',')
      newsApiUrl = `https://newsapi.org/v2/everything?q=${encodedQuery}&language=en&sortBy=publishedAt&pageSize=20&domains=${domainsParam}&apiKey=${apiKey}`
    }

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'Politeia/1.0'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(8000)
    })

    if (!response.ok) {
      return NextResponse.json(emptyPayload(ideology, mode, domains))
    }

    const rawText = await response.text()
    let data: any = {}
    try {
      data = rawText ? JSON.parse(rawText) : {}
    } catch {
      return NextResponse.json(emptyPayload(ideology, mode, domains))
    }

    let rawArticles = Array.isArray(data.articles) ? data.articles : []

    if (useExplicitSources) {
      rawArticles = filterArticlesBySourceIds(rawArticles, sourceIds)
    }

    const articles = rawArticles
      .filter((article: any) => {
        if (!article?.title || !String(article.title).trim()) return false
        if (!article?.url) return false

        if (!useExplicitSources) {
          const articleUrl = String(article.url).toLowerCase()
          const matchesDomain = domains.some((domain) =>
            articleUrl.includes(domain.toLowerCase())
          )
          if (!matchesDomain) return false
        }

        const articleUrl = String(article.url).toLowerCase()
        if (articleUrl.includes('/opinion') || articleUrl.includes('/blog')) return false

        return true
      })
      .map((article: any) => ({
        title: article.title || '',
        description: article.description || '',
        url: article.url || '',
        source: article.source?.name || article.source || '',
        sourceId: article.source?.id || undefined,
        publishedAt: article.publishedAt || '',
        imageUrl: article.urlToImage || null
      }))
      .slice(0, 10)

    return NextResponse.json(
      {
        ideology,
        mode,
        domains,
        articles
      },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    )
  } catch {
    return NextResponse.json(emptyPayload(ideology, mode, domains))
  }
}
