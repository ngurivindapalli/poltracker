import { getLocalMember } from "@/lib/congressData"
import { getPrisma } from "@/lib/db"
import { fetchNewsApiEverything, type NormalizedNewsArticle } from "@/lib/newsApi"

const CACHE_TTL_MS = 12 * 60 * 60 * 1000

function parsePublishedAt(value: string): Date | null {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

export type OfficialNewsArticle = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl: string | null
  sourceId?: string
  author?: string | null
}

function mapNormalized(article: NormalizedNewsArticle): OfficialNewsArticle {
  return {
    title: article.title,
    description: article.description,
    url: article.url,
    source: article.source,
    publishedAt: article.publishedAt,
    imageUrl: article.imageUrl,
    sourceId: article.sourceId,
    author: article.author,
  }
}

export async function readCachedNewsArticles(
  bioguideId: string
): Promise<{ articles: OfficialNewsArticle[]; fetchedAt: Date | null }> {
  const prisma = await getPrisma()
  if (!prisma?.cachedNewsArticle) {
    return { articles: [], fetchedAt: null }
  }

  const rows = await prisma.cachedNewsArticle.findMany({
    where: { bioguideId: bioguideId.toUpperCase() },
    orderBy: { publishedAt: "desc" },
    take: 20,
  })

  let fetchedAt: Date | null = null
  for (const row of rows) {
    if (!row.fetchedAt) continue
    if (!fetchedAt || row.fetchedAt > fetchedAt) fetchedAt = row.fetchedAt
  }

  return {
    articles: rows.map((row) => ({
      title: row.title,
      description: row.description || "",
      url: row.url,
      source: row.source || "",
      publishedAt: row.publishedAt ? row.publishedAt.toISOString() : "",
      imageUrl: row.imageUrl,
    })),
    fetchedAt,
  }
}

export async function upsertCachedNewsArticles(
  bioguideId: string,
  articles: NormalizedNewsArticle[]
): Promise<number> {
  const prisma = await getPrisma()
  if (!prisma?.cachedNewsArticle) return 0

  const bid = bioguideId.toUpperCase()
  const fetchedAt = new Date()
  let written = 0

  for (const article of articles) {
    if (!article.url || !article.title) continue
    await prisma.cachedNewsArticle.upsert({
      where: {
        bioguideId_url: { bioguideId: bid, url: article.url },
      },
      create: {
        bioguideId: bid,
        title: article.title,
        url: article.url,
        source: article.source || null,
        description: article.description || null,
        publishedAt: parsePublishedAt(article.publishedAt),
        imageUrl: article.imageUrl,
        fetchedAt,
      },
      update: {
        title: article.title,
        source: article.source || null,
        description: article.description || null,
        publishedAt: parsePublishedAt(article.publishedAt),
        imageUrl: article.imageUrl,
        fetchedAt,
      },
    })
    written += 1
  }

  return written
}

function memberNewsQuery(bioguideId: string): string | null {
  const member = getLocalMember(bioguideId)
  const name = String(member?.name || "").trim()
  if (!name) return null
  return `"${name}"`
}

export async function getOrRefreshOfficialNews(
  bioguideId: string
): Promise<{ articles: OfficialNewsArticle[]; refreshed: boolean }> {
  const bid = bioguideId.toUpperCase()
  const cached = await readCachedNewsArticles(bid)
  const fresh =
    cached.articles.length >= 3 &&
    cached.fetchedAt != null &&
    Date.now() - cached.fetchedAt.getTime() < CACHE_TTL_MS

  if (fresh) {
    return { articles: cached.articles, refreshed: false }
  }

  const query = memberNewsQuery(bid)
  if (!query) {
    return { articles: cached.articles, refreshed: false }
  }

  const live = await fetchNewsApiEverything({
    q: query,
    pageSize: 10,
    context: `official:${bid}`,
  })

  if (live.articles.length > 0) {
    try {
      await upsertCachedNewsArticles(bid, live.articles)
    } catch (err) {
      console.info("[newsapi]", {
        provider: "newsapi",
        endpoint: "cache_upsert",
        context: `official:${bid}`,
        errorType: err instanceof Error ? err.name : "upsert_failed",
      })
    }
    return { articles: live.articles.map(mapNormalized), refreshed: true }
  }

  return { articles: cached.articles, refreshed: false }
}
