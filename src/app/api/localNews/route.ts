import { NextResponse } from "next/server"
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from "@/lib/newsSources"
import { fetchNewsApiEverything } from "@/lib/newsApi"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const state = searchParams.get("state")
  const county = searchParams.get("county")

  if (!state || !county) {
    return NextResponse.json(
      { error: "Missing state or county parameter" },
      { status: 400 }
    )
  }

  if (!process.env.NEWS_API_KEY) {
    console.info("[newsapi]", {
      provider: "newsapi",
      endpoint: "everything",
      context: "localNews",
      keyPresent: false,
    })
    return NextResponse.json(
      { articles: [], error: "News API key not configured" },
      { status: 200 }
    )
  }

  const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(searchParams)

  try {
    const live = await fetchNewsApiEverything({
      q: `${county} ${state} government OR politics OR election`,
      pageSize: 10,
      context: `local:${state}:${county}`,
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
      title: article.title || "Untitled",
      description: article.description || "",
      source: article.rawSource?.name || article.source || "Unknown",
      url: article.url,
      urlToImage: article.urlToImage || null,
      publishedAt: article.publishedAt || "",
      author: article.author,
    }))

    return NextResponse.json({ articles })
  } catch (error) {
    console.info("[newsapi]", {
      provider: "newsapi",
      endpoint: "everything",
      context: "localNews",
      errorType: error instanceof Error ? error.name : "fetch_failed",
    })
    return NextResponse.json({ articles: [] })
  }
}
