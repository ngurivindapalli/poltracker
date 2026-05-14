import { MAYORS } from "@/data/mayors"
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
} from "@/lib/newsSources"

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  const mayor = MAYORS.find((m) => m.slug === slug)
  if (!mayor || !process.env.NEWS_API_KEY) {
    return Response.json([])
  }

  const urlObj = new URL(req.url)
  const { ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)
  const sourcesQ = buildNewsApiSourcesQueryParam(sourceIds)

  try {
    const query = encodeURIComponent(`${mayor.name} ${mayor.city}`)
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${query}` +
        `&language=en&sortBy=publishedAt&pageSize=10` +
        `&sources=${encodeURIComponent(sourcesQ)}` +
        `&apiKey=${process.env.NEWS_API_KEY}`,
      { headers: { "User-Agent": "PolTracker/1.0" } }
    )
    const data = await res.json()
    const articles = Array.isArray(data.articles) ? data.articles : []
    const filtered = filterArticlesBySourceIds(articles, sourceIds)

    return Response.json(filtered.slice(0, 10))
  } catch {
    return Response.json([])
  }
}
