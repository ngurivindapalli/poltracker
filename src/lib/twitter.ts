export type PublicTweet = {
  text: string
  date: string
  url: string
  link?: string
}

const cache: Record<string, { tweets: PublicTweet[]; timestamp: number }> = {}
const CACHE_DURATION = 1000 * 60 * 10

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.cz",
  "https://nitter.privacydev.net",
  "https://nitter.net",
]

export async function fetchTweetsForHandle(handle: string): Promise<PublicTweet[]> {
  const key = handle.replace(/^@/, "").trim()
  if (!key) return []

  const cached = cache[key]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.tweets
  }

  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${key}/rss`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/rss+xml",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(3500),
      })
      if (!res.ok) continue

      const xml = await res.text()
      const tweets: PublicTweet[] = []
      const items = xml.split("<item>").slice(1)

      for (const item of items) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/)
        const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
        const linkMatch = item.match(/<link>(.*?)<\/link>/)
        if (!titleMatch) continue

        const text = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
        const url = linkMatch ? linkMatch[1] : ""

        tweets.push({
          text,
          date: dateMatch ? dateMatch[1] : "",
          url,
          link: url,
        })
        if (tweets.length >= 5) break
      }

      if (tweets.length > 0) {
        cache[key] = { tweets, timestamp: Date.now() }
        return tweets
      }
    } catch {
      continue
    }
  }

  return []
}
