export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

import { NextResponse } from 'next/server'
import { fetchMember } from '@/lib/congress'
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from '@/lib/newsSources'
import { fetchNewsApiEverything } from '@/lib/newsApi'

const cache = new Map<string, { timestamp: number; articles: any[] }>()
const CACHE_TTL_MS = 10 * 60 * 1000

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

export async function GET(
  req: Request,
  { params }: { params: { bioguideId: string } }
) {
  try {
    const bioguideId = params.bioguideId

    if (!process.env.NEWS_API_KEY) {
      console.info('[newsapi]', {
        provider: 'newsapi',
        endpoint: 'everything',
        context: `senator:${bioguideId}`,
        keyPresent: false,
      })
      return NextResponse.json(
        { error: 'NEWS_API_KEY missing', sourceType: 'major', articles: [] },
        { status: 500 }
      )
    }

    const url = new URL(req.url)
    const coverage = url.searchParams.get('coverage') || 'major'
    const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)

    const cacheKey = `${bioguideId}:${coverage}:src:${sourceIds.join(',')}`
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
      console.info('[newsapi]', {
        provider: 'newsapi',
        endpoint: 'family_lookup',
        context: `senator:${bioguideId}`,
        errorType: err instanceof Error ? err.name : 'family_fetch_failed',
      })
    }

    const allNames = [fullName, ...familyNames].filter(Boolean)
    const query = allNames.map((name) => `"${name}"`).join(' OR ')
    const live = await fetchNewsApiEverything({
      q: query,
      pageSize: 20,
      context: `senator:${bioguideId}`,
    })

    const withSource = live.articles.map((article) => ({
      ...article,
      source: article.rawSource,
    }))
    const filtered = applyRequestedSourceFilter(withSource, paramPresent, sourceIds)
      .filter((article) => !shouldFilterUrl(article.url) && article.title.trim())
      .map((article) => ({
        title: article.title,
        description: article.description,
        url: article.url,
        source: article.rawSource?.name || article.source,
        sourceId: article.sourceId,
        publishedAt: article.publishedAt,
        urlToImage: article.urlToImage || undefined,
        author: article.author,
      }))

    const processedArticles = deduplicateArticles(filtered).slice(0, 10)

    cache.set(cacheKey, {
      timestamp: Date.now(),
      articles: processedArticles
    })

    return NextResponse.json({
      sourceType: coverage,
      articles: processedArticles
    })
  } catch (err: unknown) {
    console.info('[newsapi]', {
      provider: 'newsapi',
      endpoint: 'everything',
      context: 'senator_news',
      errorType: err instanceof Error ? err.name : 'server_error',
    })
    return NextResponse.json(
      { error: 'server_error', sourceType: 'major', articles: [] },
      { status: 500 }
    )
  }
}
