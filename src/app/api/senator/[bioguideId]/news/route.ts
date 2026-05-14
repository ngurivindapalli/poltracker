export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
  getArticleSourceKey
} from '@/lib/newsSources'

// In-memory cache: Map<cacheKey, { timestamp: number; articles: any[] }>
const cache = new Map<string, { timestamp: number; articles: any[] }>()
const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function shouldFilterUrl(url: string): boolean {
  if (!url) return true
  const lowerUrl = url.toLowerCase()
  return lowerUrl.includes('opinion') || lowerUrl.includes('/blog')
}

function deduplicateArticles(articles: any[]): any[] {
  const seen = new Set<string>()
  const unique: any[] = []

  for (const article of articles) {
    const normalizedTitle = normalizeTitle(article.title || '')
    if (normalizedTitle && !seen.has(normalizedTitle)) {
      seen.add(normalizedTitle)
      unique.push(article)
    }
  }

  return unique
}

function mapArticle(article: any) {
  const src = article.source
  const sourceName = typeof src === 'object' && src?.name ? src.name : String(src ?? '')
  const sourceId = typeof src === 'object' && src?.id ? src.id : getArticleSourceKey(src ?? { name: sourceName })
  return {
    title: article.title || '',
    description: article.description || '',
    url: article.url || '',
    source: sourceName,
    sourceId: sourceId || undefined,
    publishedAt: article.publishedAt || '',
    urlToImage: article.urlToImage || undefined
  }
}

function processArticlesMajor(
  rawArticles: any[],
  allowedSourceIds: string[]
): any[] {
  const allow = new Set(allowedSourceIds.map((x) => x.toLowerCase()))

  return rawArticles
    .filter((article: any) => {
      const key = getArticleSourceKey(article.source)
      if (!key || !allow.has(key)) return false
      if (shouldFilterUrl(article.url)) return false
      if (!article.title || !article.title.trim()) return false
      return true
    })
    .map(mapArticle)
    .sort((a, b) => {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    })
}

function processArticlesAll(rawArticles: any[], allowedSourceIds: string[]): any[] {
  const filtered = filterArticlesBySourceIds(rawArticles, allowedSourceIds)
  return filtered
    .filter((article: any) => {
      if (shouldFilterUrl(article.url)) return false
      if (!article.title || !article.title.trim()) return false
      return true
    })
    .map(mapArticle)
}

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId

    if (!process.env.NEWS_API_KEY) {
      return NextResponse.json(
        { error: 'NEWS_API_KEY missing', sourceType: 'major', articles: [] },
        { status: 500 }
      )
    }

    const url = new URL(req.url)
    const coverage = url.searchParams.get('coverage') || 'major'
    const { ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)
    const sourcesKey = buildNewsApiSourcesQueryParam(sourceIds)

    const cacheKey = `${bioguideId}:${coverage}:src:${sourcesKey}`
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        sourceType: coverage,
        articles: cached.articles
      })
    }

    const senatorData = await fetchMember(bioguideId)
    const member = senatorData?.member ?? senatorData

    const fullName = member?.directOrderName ?? member?.name ?? member?.fullName

    if (!fullName) {
      return NextResponse.json({
        sourceType: coverage,
        articles: []
      })
    }

    let familyNames: string[] = []
    try {
      const { getBaseUrl } = await import('@/lib/getBaseUrl')
      const base = getBaseUrl()
      const familyRes = await fetch(`${base}/api/member/${bioguideId}/family?country=US`, {
        cache: 'no-store'
      })
      if (familyRes.ok) {
        const familyData = await familyRes.json()
        familyNames = (familyData.family || []).map((f: any) => f.name).filter(Boolean)
      }
    } catch (err) {
      console.error('Error fetching family data for news query:', err)
    }

    const apiKey = process.env.NEWS_API_KEY!
    const allNames = [fullName, ...familyNames].filter(Boolean)
    const queryParts = allNames.map((name) => `"${name}"`)
    const query = encodeURIComponent(queryParts.join(' OR '))

    const sourcesParam = `&sources=${encodeURIComponent(sourcesKey)}`
    const newsApiUrl = `https://newsapi.org/v2/everything?q=${query}&language=en&sortBy=publishedAt&pageSize=20&apiKey=${apiKey}${sourcesParam}`

    const response = await fetch(newsApiUrl, {
      headers: {
        'User-Agent': 'PolTracker/1.0'
      }
    })

    if (!response.ok) {
      return NextResponse.json({
        sourceType: coverage,
        articles: []
      })
    }

    const data = await response.json()
    const rawArticles = data.articles || []

    let processedArticles: any[]

    if (coverage === 'all') {
      processedArticles = processArticlesAll(rawArticles, sourceIds)
    } else {
      processedArticles = processArticlesMajor(rawArticles, sourceIds)
    }

    processedArticles = deduplicateArticles(processedArticles)
    processedArticles = processedArticles.slice(0, 10)

    cache.set(cacheKey, {
      timestamp: Date.now(),
      articles: processedArticles
    })

    return NextResponse.json({
      sourceType: coverage,
      articles: processedArticles
    })
  } catch (err: unknown) {
    console.error('Error fetching news:', err)
    return NextResponse.json(
      { error: 'server_error', sourceType: 'major', articles: [] },
      { status: 500 }
    )
  }
}
