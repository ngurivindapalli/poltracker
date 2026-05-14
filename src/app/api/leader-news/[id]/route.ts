import { NextResponse } from "next/server"
import { GLOBAL_LEADERS } from "@/data/globalLeaders"
import {
  resolveNewsSourcesQuery,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds
} from "@/lib/newsSources"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const leader = GLOBAL_LEADERS.find((l) => l.slug === params.id)

  if (!leader) {
    return NextResponse.json([])
  }

  const NEWS_KEY = process.env.NEWS_API_KEY
  if (!NEWS_KEY) {
    return NextResponse.json([])
  }

  const urlObj = new URL(req.url)
  const { ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)
  const sourcesParam = `&sources=${encodeURIComponent(buildNewsApiSourcesQueryParam(sourceIds))}`

  const query = encodeURIComponent(leader.name)

  const apiUrl = `https://newsapi.org/v2/everything?q=${query}&sortBy=publishedAt&pageSize=12&language=en&apiKey=${NEWS_KEY}${sourcesParam}`

  try {
    const res = await fetch(apiUrl, {
      cache: "no-store"
    })

    if (!res.ok) {
      return NextResponse.json([])
    }

    const json = await res.json()
    const raw = json.articles || []
    const filtered = filterArticlesBySourceIds(raw, sourceIds)

    return NextResponse.json(filtered)
  } catch (e) {
    console.error("Leader news error:", e)
    return NextResponse.json([])
  }
}
