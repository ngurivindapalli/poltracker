import { MAYORS } from "@/data/mayors"
import { resolveNewsSourcesQuery, applyRequestedSourceFilter } from "@/lib/newsSources"
import { fetchNewsApiEverything, newsApiKeyPresent } from "@/lib/newsApi"

export async function GET(
  req: Request,
  { params }: { params: { slug: string } }
) {
  const { slug } = params
  const mayor = MAYORS.find((m) => m.slug === slug)
  if (!mayor || !newsApiKeyPresent()) {
    return Response.json([])
  }

  const urlObj = new URL(req.url)
  const { paramPresent, ids: sourceIds } = resolveNewsSourcesQuery(urlObj.searchParams)

  try {
    const live = await fetchNewsApiEverything({
      q: `${mayor.name} ${mayor.city}`,
      pageSize: 10,
      context: `mayor:${slug}`,
    })
    const filtered = applyRequestedSourceFilter(
      live.articles.map((article) => ({
        ...article,
        source: article.rawSource,
      })),
      paramPresent,
      sourceIds
    )
    return Response.json(filtered.slice(0, 10))
  } catch {
    return Response.json([])
  }
}
