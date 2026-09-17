export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { ideologyFromParty } from '@/lib/ideology'
import { domainsForMode } from '@/lib/newsSources'
import type { Ideology } from '@/lib/ideology'
import {
  resolveNewsSourcesQuery,
  filterArticlesBySourceIds
} from '@/lib/newsSources'
import { getLocalMember } from '@/lib/congressData'
import { getPrisma } from '@/lib/db'
import { getDatasetFreshness } from '@/lib/sync/freshness'

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

    const prisma = await getPrisma()
    if (!prisma?.cachedNewsArticle || !bioguideId) {
      return NextResponse.json(emptyPayload(ideology, mode, domains, lastUpdated))
    }

    const rows = await prisma.cachedNewsArticle.findMany({
      where: { bioguideId: bioguideId.toUpperCase() },
      orderBy: { publishedAt: 'desc' },
      take: 20,
    })

    let articles = rows.map((r: any) => ({
      title: r.title,
      description: r.description || '',
      url: r.url,
      source: r.source || '',
      publishedAt: r.publishedAt ? r.publishedAt.toISOString() : '',
      imageUrl: r.imageUrl,
    }))

    if (paramPresent) {
      articles = filterArticlesBySourceIds(
        articles.map((a: any) => ({
          ...a,
          source: { name: a.source }
        })),
        sourceIds
      ).map((a: any) => ({
        title: a.title,
        description: a.description,
        url: a.url,
        source: a.source?.name || a.source,
        publishedAt: a.publishedAt,
        imageUrl: a.imageUrl,
      }))
    }

    return NextResponse.json(
      { ideology, mode, domains, articles, lastUpdated },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
        }
      }
    )
  } catch {
    return NextResponse.json(emptyPayload(ideology, mode, domains, lastUpdated))
  }
}
