export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { ideologyFromParty } from '@/lib/ideology'
import { domainsForMode, resolveNewsSourcesQuery, applyRequestedSourceFilter } from '@/lib/newsSources'
import type { Ideology } from '@/lib/ideology'
import { getLocalMember } from '@/lib/congressData'
import { getDatasetFreshness } from '@/lib/sync/freshness'
import { getOrRefreshOfficialNews } from '@/lib/newsCache'

function emptyPayload(ideology: Ideology, mode: string, domains: string[], lastUpdated: string | null = null) {
  return {
    ideology,
    mode,
    domains,
    articles: [] as unknown[],
    lastUpdated
  }
}

export async function GET(req: Request) {
  let ideology: Ideology = 'center'
  let mode: 'aligned' | 'balanced' | 'opposing' = 'aligned'
  let domains: string[] = []
  const freshness = await getDatasetFreshness('news')
  const lastUpdated = freshness?.lastSuccessfulSync ?? null

  try {
    const url = new URL(req.url)
    const bioguideId = url.searchParams.get('bioguideId')
    const requestedMode = url.searchParams.get('mode')
    if (requestedMode === 'balanced' || requestedMode === 'opposing' || requestedMode === 'aligned') {
      mode = requestedMode
    }
    const party = url.searchParams.get('party')
    const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(url.searchParams)

    if (bioguideId) {
      const member = getLocalMember(bioguideId)
      ideology = ideologyFromParty(member?.party || party)
    } else if (party) {
      ideology = ideologyFromParty(party)
    }

    domains = domainsForMode(ideology, mode)

    if (!bioguideId) {
      return NextResponse.json(emptyPayload(ideology, mode, domains, lastUpdated))
    }

    const { articles: cached } = await getOrRefreshOfficialNews(bioguideId)
    const articles = applyRequestedSourceFilter(
      cached.map((article) => ({
        ...article,
        source: { name: article.source, id: article.sourceId },
      })),
      paramPresent,
      sourceIds
    ).map((article) => ({
      title: article.title,
      description: article.description || '',
      url: article.url,
      source: article.source?.name || article.source,
      publishedAt: article.publishedAt,
      imageUrl: article.imageUrl,
      author: article.author ?? null,
    }))

    return NextResponse.json(
      { ideology, mode, domains, articles, lastUpdated },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    )
  } catch (err) {
    console.info('[newsapi]', {
      provider: 'newsapi',
      endpoint: 'official_cache',
      errorType: err instanceof Error ? err.name : 'server_error',
    })
    return NextResponse.json(emptyPayload(ideology, mode, domains, lastUpdated))
  }
}
