export async function fetchGermanMemberNews(name: string) {
  const apiKey = process.env.NEWS_API_KEY

  const url =
    `https://newsapi.org/v2/everything?` +
    `q=${encodeURIComponent(name + " Germany politics")}` +
    `&language=en` +
    `&pageSize=20` +
    `&sortBy=publishedAt` +
    `&domains=dw.com,spiegel.de,reuters.com,politico.eu,bloomberg.com` +
    `&apiKey=${apiKey}`

  try {
    const res = await fetch(url)

    const data = await res.json()

    if (!data.articles) return []

    return data.articles
  } catch {
    return []
  }
}
