import { NextResponse } from "next/server"
import { GLOBAL_LEADERS } from "@/data/globalLeaders"
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from "@/lib/newsSources"
import { fetchNewsApiEverything, newsApiKeyPresent } from "@/lib/newsApi"

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const leader = GLOBAL_LEADERS.find((l) => l.slug === params.id)

  if (!leader) {
    return NextResponse.json([])
  }

  if (!newsApiKeyPresent()) {
    return NextResponse.json([])
  }

  const urlObj = new URL(req.url)
  const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)

  try {
    const live = await fetchNewsApiEverything({
      q: leader.name,
      pageSize: 12,
      context: `leader:${leader.slug}`,
    })
    const filtered = applyRequestedSourceFilter(
      live.articles.map((article) => ({
        ...article,
        source: article.rawSource,
      })),
      paramPresent,
      sourceIds
    )
    return NextResponse.json(filtered)
  } catch (e) {
    console.info("[newsapi]", {
      provider: "newsapi",
      endpoint: "everything",
      context: `leader:${params.id}`,
      errorType: e instanceof Error ? e.name : "fetch_failed",
    })
    return NextResponse.json([])
  }
}
