export async function fetchUKNews(sort = "publishedAt") {
  const apiKey = process.env.NEWS_API_KEY

  const query = `
    ("United Kingdom" OR UK OR Britain OR British OR Westminster)
    AND
    (government OR parliament OR politics OR election OR policy)
  `

  const url =
    `https://newsapi.org/v2/everything?` +
    `q=${encodeURIComponent(query)}` +
    `&language=en` +
    `&sortBy=${sort}` +
    `&pageSize=40` +
    `&domains=bbc.co.uk,bbc.com,theguardian.com,telegraph.co.uk,independent.co.uk,sky.com,reuters.com` +
    `&apiKey=${apiKey}`

  try {
    const res = await fetch(url)

    const data = await res.json()

    if (!data.articles) return []

    // FILTER OUT NON-UK ARTICLES

    const filtered = data.articles.filter((a: any) => {
      const text = (
        (a.title || "") +
        (a.description || "")
      ).toLowerCase()

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

    return filtered.slice(0, 30)
  } catch {
    return []
  }
}
