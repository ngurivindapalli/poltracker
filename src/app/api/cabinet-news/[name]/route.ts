import { NextResponse } from "next/server"
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from "@/lib/newsSources"
import { fetchNewsApiEverything, newsApiKeyPresent } from "@/lib/newsApi"

export async function GET(req: Request, { params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name)
  const urlObj = new URL(req.url)
  const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)

  if (!newsApiKeyPresent()) {
    return NextResponse.json({ articles: [] })
  }

  try {
    const live = await fetchNewsApiEverything({
      q: name,
      pageSize: 5,
      context: `cabinet:${name}`,
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
      url: article.url,
      description: article.description,
      source: article.rawSource,
      publishedAt: article.publishedAt,
      urlToImage: article.urlToImage,
      author: article.author,
    }))

    return NextResponse.json({ articles })
  } catch {
    return NextResponse.json({ articles: [] })
  }
}
