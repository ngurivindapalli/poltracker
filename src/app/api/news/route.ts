export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getCache, setCache } from '@/lib/cache'
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from '@/lib/newsSources'
import { fetchNewsApiEverything } from '@/lib/newsApi'

export async function GET(req: Request) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q')
    const scope = url.searchParams.get('scope')
    const state = url.searchParams.get('state')
    const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)

    const cacheKey = `news-${scope || 'general'}-${state || ''}-${query || ''}-src-${sourceIds.join(',')}`
    const cached = getCache(cacheKey)
    if (cached) {
      return NextResponse.json(cached)
    }

    if (!query && !state) {
      return NextResponse.json({ articles: [] })
    }

    const searchQuery = query || (state ? `${state} politics` : 'US politics')
    const live = await fetchNewsApiEverything({
      q: searchQuery,
      pageSize: 10,
      context: `news:${scope || 'general'}`,
    })

    const filtered = applyRequestedSourceFilter(
      live.articles.map((article) => ({
        ...article,
        source: article.rawSource,
      })),
      paramPresent,
      sourceIds
    )

    const articles = filtered.map((article) => ({
      title: article.title,
      description: article.description,
      url: article.url,
      source: article.rawSource || article.source,
      publishedAt: article.publishedAt,
      urlToImage: article.urlToImage,
      imageUrl: article.imageUrl,
      author: article.author,
    }))

    const result = { articles }
    setCache(cacheKey, result, 900000)
    return NextResponse.json(result)
  } catch (err: unknown) {
    console.info('[newsapi]', {
      provider: 'newsapi',
      endpoint: 'everything',
      context: 'news_route',
      errorType: err instanceof Error ? err.name : 'server_error',
    })
    return NextResponse.json({ articles: [] })
  }
}
