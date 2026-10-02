import { fetchNewsApiEverything } from "@/lib/newsApi"

export async function fetchUKNews(sort = "publishedAt") {
  const query = `
    ("United Kingdom" OR UK OR Britain OR British OR Westminster)
    AND
    (government OR parliament OR politics OR election OR policy)
  `

  try {
    const live = await fetchNewsApiEverything({
      q: query,
      pageSize: 30,
      sortBy: sort,
      context: "uk",
    })

    const filtered = live.articles.filter((a) => {
      const text = `${a.title || ""} ${a.description || ""}`.toLowerCase()
      return (
        text.includes("uk") ||
        text.includes("britain") ||
        text.includes("british") ||
        text.includes("westminster") ||
        text.includes("england") ||
        text.includes("scotland") ||
        text.includes("wales") ||
        text.includes("northern ireland")
      )
    })

    return filtered.slice(0, 30).map((a) => ({
      title: a.title,
      description: a.description,
      url: a.url,
      urlToImage: a.urlToImage,
      publishedAt: a.publishedAt,
      source: a.rawSource,
      author: a.author,
    }))
  } catch {
    return []
  }
}
