import { NextResponse } from "next/server"

const cache: Record<string, {tweets:any, timestamp:number}> = {}

const CACHE_DURATION = 1000 * 60 * 10

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.cz",
  "https://nitter.privacydev.net",
  "https://nitter.net"
]

export async function GET(req: Request, { params }: any) {
  const handle = params.handle

  if (!handle) {
    return NextResponse.json({ tweets: [] })
  }

  const cached = cache[handle]

  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return NextResponse.json({ tweets: cached.tweets })
  }

  for (const instance of NITTER_INSTANCES) {
    try {
      const url = `${instance}/${handle}/rss`

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "application/rss+xml"
        },
        cache: "no-store"
      })

      if (!res.ok) continue

      const xml = await res.text()

      const tweets = []

      const items = xml.split("<item>").slice(1)

      for (const item of items) {
        const titleMatch = item.match(/<title>(.*?)<\/title>/)
        const dateMatch = item.match(/<pubDate>(.*?)<\/pubDate>/)
        const linkMatch = item.match(/<link>(.*?)<\/link>/)

        if (!titleMatch) continue

        const text = titleMatch[1]
          .replace(/&amp;/g,"&")
          .replace(/&lt;/g,"<")
          .replace(/&gt;/g,">")

        const link = linkMatch ? linkMatch[1] : ""

        tweets.push({
          text,
          date: dateMatch ? dateMatch[1] : "",
          url: link
        })

        if (tweets.length >= 5) break
      }

      if (tweets.length > 0) {
        cache[handle] = {
          tweets,
          timestamp: Date.now()
        }

        return NextResponse.json({ tweets })
      }

    } catch {
      continue
    }
  }

  return NextResponse.json({
    tweets: [],
    error: "No Nitter instances available"
  })
}
