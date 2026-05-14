export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache'
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds
} from '@/lib/newsSources'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const scope = url.searchParams.get('scope')
    const state = url.searchParams.get('state')
    const { ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)
    const sourcesKey = buildNewsApiSourcesQueryParam(sourceIds)

    // Build cache key (include sources so different filters don't collide)
    const cacheKey = `news-${scope || 'general'}-${state || ''}-${query || ''}-src-${sourcesKey}`

    // Check cache first
    const cached = getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (!query && !state) {
      return NextResponse.json({ articles: [] })
    }

    const apiKey = process.env.NEWS_API_KEY

    if (!apiKey) {
      return NextResponse.json({ articles: [] })
    }

    // Build query
    const searchQuery = query || (state ? `${state} politics` : 'US politics')
    const sourcesParam = `&sources=${encodeURIComponent(sourcesKey)}`
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(searchQuery)}&language=en&sortBy=publishedAt&pageSize=10&apiKey=${apiKey}${sourcesParam}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      },
      next: { revalidate: 900 } // Cache for 15 minutes
    })

    if (!response.ok) {
      return NextResponse.json({ articles: [] })
    }

    const data = await response.json()
    const raw = data.articles || []
    const articles = filterArticlesBySourceIds(raw, sourceIds)

    const result = {
      articles
    }

    // Cache the result (15 minutes)
    setCache(cacheKey, result, 900000)

    return NextResponse.json(result)
  } catch (err: unknown) {
    console.error('Error fetching news:', err)
    return NextResponse.json({ articles: [] })
  }
}
