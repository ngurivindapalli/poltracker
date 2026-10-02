export type NormalizedNewsArticle = {
  title: string
  description: string
  url: string
  source: string
  sourceId?: string
  publishedAt: string
  imageUrl: string | null
  urlToImage: string | null
  author: string | null
  rawSource: { id: string | null; name: string | null }
}

export type NewsApiFetchResult = {
  articles: NormalizedNewsArticle[]
  httpStatus: number
  errorType: string | null
}

function newsApiKey(): string | null {
  const key = process.env.NEWS_API_KEY?.trim()
  return key || null
}

export function newsApiKeyPresent(): boolean {
  return Boolean(newsApiKey())
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : ""
}

export function normalizeNewsApiArticle(raw: unknown): NormalizedNewsArticle | null {
  if (!raw || typeof raw !== "object") return null
  const article = raw as Record<string, unknown>
  const title = asString(article.title)
  const url = asString(article.url)
  if (!title || !url || title === "[Removed]") return null
  try {
    new URL(url)
  } catch {
    return null
  }

  const src = article.source
  let sourceId: string | null = null
  let sourceName = ""
  if (src && typeof src === "object") {
    const obj = src as { id?: unknown; name?: unknown }
    sourceId = asString(obj.id) || null
    sourceName = asString(obj.name)
  } else if (typeof src === "string") {
    sourceName = src.trim()
  }

  const description = asString(article.description)
  const publishedAt = asString(article.publishedAt)
  const image = asString(article.urlToImage) || asString(article.imageUrl) || null
  const author = asString(article.author) || null

  return {
    title,
    description,
    url,
    source: sourceName,
    sourceId: sourceId || undefined,
    publishedAt,
    imageUrl: image,
    urlToImage: image,
    author,
    rawSource: { id: sourceId, name: sourceName || null },
  }
}

function logNewsApi(fields: Record<string, unknown>) {
  console.info("[newsapi]", {
    provider: "newsapi",
    endpoint: "everything",
    keyPresent: newsApiKeyPresent(),
    ...fields,
  })
}

export async function fetchNewsApiEverything(opts: {
  q: string
  pageSize?: number
  language?: string
  sortBy?: string
  context?: string
}): Promise<NewsApiFetchResult> {
  const key = newsApiKey()
  const context = opts.context || "unknown"
  if (!key) {
    logNewsApi({ context, http: 0, errorType: "missing_key", articles: 0 })
    return { articles: [], httpStatus: 0, errorType: "missing_key" }
  }

  const query = opts.q.trim()
  if (!query) {
    logNewsApi({ context, http: 0, errorType: "empty_query", articles: 0 })
    return { articles: [], httpStatus: 0, errorType: "empty_query" }
  }

  const pageSize = Math.min(Math.max(opts.pageSize ?? 10, 1), 30)
  const params = new URLSearchParams({
    q: query,
    language: opts.language || "en",
    sortBy: opts.sortBy || "publishedAt",
    pageSize: String(pageSize),
  })

  try {
    const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, {
      headers: {
        "User-Agent": "Politeia/1.0",
        "X-Api-Key": key,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(12000),
    })

    const httpStatus = response.status
    if (httpStatus === 429) {
      logNewsApi({ context, http: httpStatus, errorType: "rate_limited", articles: 0 })
      return { articles: [], httpStatus, errorType: "rate_limited" }
    }

    const body = await response.json().catch(() => ({} as Record<string, unknown>))
    if (!response.ok || body.status === "error") {
      const errorType =
        typeof body.code === "string" ? body.code : `http_${httpStatus}`
      logNewsApi({ context, http: httpStatus, errorType, articles: 0 })
      return { articles: [], httpStatus, errorType }
    }

    const raw = Array.isArray(body.articles) ? body.articles : []
    const articles: NormalizedNewsArticle[] = []
    for (const item of raw) {
      const normalized = normalizeNewsApiArticle(item)
      if (normalized) articles.push(normalized)
    }

    logNewsApi({ context, http: httpStatus, errorType: null, articles: articles.length })
    return { articles, httpStatus, errorType: null }
  } catch (err) {
    const errorType =
      err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
        ? "timeout"
        : "fetch_failed"
    logNewsApi({ context, http: 0, errorType, articles: 0 })
    return { articles: [], httpStatus: 0, errorType }
  }
}
