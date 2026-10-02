import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from "@/lib/newsSources"
import { fetchNewsApiEverything, newsApiKeyPresent } from "@/lib/newsApi"

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params

  if (!newsApiKeyPresent()) {
    return Response.json([])
  }

  const name = slug.replace(/-/g, " ")
  const urlObj = new URL(req.url)
  const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)

  try {
    const live = await fetchNewsApiEverything({
      q: name,
      pageSize: 10,
      context: `governor:${slug}`,
    })
    const filtered = applyRequestedSourceFilter(
      live.articles.map((article) => ({
        ...article,
        source: article.rawSource,
      })),
      paramPresent,
      sourceIds
    )
    return Response.json(filtered.slice(0, 5))
  } catch {
    return Response.json([])
  }
}
