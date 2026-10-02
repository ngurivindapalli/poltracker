import { fetchNewsApiEverything } from "@/lib/newsApi"

export async function fetchGermanMemberNews(name: string) {
  try {
    const live = await fetchNewsApiEverything({
      q: `${name} Germany politics`,
      pageSize: 20,
      context: `germany:${name}`,
    })
    return live.articles.map((a) => ({
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
