import { NextResponse } from "next/server"
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
} from "@/lib/newsSources"

const API_KEY = process.env.NEWS_API_KEY

export async function GET(req: Request, { params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  const urlObj = new URL(req.url)
  const { ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)
  const sourcesQ = buildNewsApiSourcesQueryParam(sourceIds)

  if (!API_KEY) {
    return NextResponse.json({ articles: [] })
  }

  const newsUrl =
    `https://newsapi.org/v2/everything?q=${encodeURIComponent(name)}` +
    `&language=en&sortBy=publishedAt&pageSize=5&sources=${encodeURIComponent(sourcesQ)}&apiKey=${API_KEY}`

  try {
    const res = await fetch(newsUrl, {
      headers: { "User-Agent": "PolTracker/1.0" },
      next: { revalidate: 900 },
    })

    if (!res.ok) {
      return NextResponse.json({ articles: [] })
    }

    const data = await res.json()
    const raw = Array.isArray(data.articles) ? data.articles : []
    const filtered = filterArticlesBySourceIds(raw, sourceIds)

    const articles = filtered.map((a: any) => ({
      title: a.title,
      url: a.url,
      description: a.description,
      source: a.source?.name ? a.source : { name: String(a.source ?? "") },
      publishedAt: a.publishedAt,
      urlToImage: a.urlToImage,
    }))

    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
