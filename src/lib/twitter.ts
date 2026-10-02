import Parser from "rss-parser"

export type PublicTweet = {
  id?: string
  text: string
  date: string
  url: string
  link?: string
  authorName?: string
  username?: string
  profileImage?: string
}

const cache: Record<string, { tweets: PublicTweet[]; timestamp: number }> = {}
const CACHE_DURATION = 1000 * 60 * 10

const NITTER_INSTANCES = [
  "https://nitter.poast.org",
  "https://nitter.privacydev.net",
  "https://nitter.cz",
  "https://nitter.net",
  "https://nitter.cf",
  "https://rss.xcancel.com",
]

const rssParser = new Parser({
  timeout: 4000,
  headers: {
    "User-Agent": "Mozilla/5.0",
    Accept: "application/rss+xml, application/xml, text/xml",
  },
})

function twitterBearer(): string | null {
  const names = [
    "TWITTER_BEARER_TOKEN",
    "X_BEARER_TOKEN",
    "TWITTER_TOKEN",
  ]
  for (const name of names) {
    const value = process.env[name]?.trim()
    if (value) return value
  }
  return null
}

function twitterBearerPresent(): boolean {
  return Boolean(twitterBearer())
}

function cleanHandle(handle: string): string {
  return handle.replace(/^@/, "").trim()
}

function publicTweetUrl(url: string, handle: string): string {
  if (!url) return ""
  try {
    const parsed = new URL(url)
    const match = parsed.pathname.match(/\/([^/]+)\/status\/(\d+)/)
    if (match) {
      return `https://x.com/${match[1]}/status/${match[2]}`
    }
  } catch {
    /* keep original */
  }
  if (url.startsWith("http")) return url
  return handle ? `https://x.com/${handle}` : url
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

function logTwitter(fields: Record<string, unknown>) {
  console.info("[twitter]", {
    keyPresent: twitterBearerPresent(),
    ...fields,
  })
}

function normalizeTweet(raw: unknown, username: string): PublicTweet | null {
  if (!raw || typeof raw !== "object") return null
  const tweet = raw as Record<string, unknown>
  const text = typeof tweet.text === "string" ? tweet.text.trim() : ""
  if (!text) return null
  const id = typeof tweet.id === "string" ? tweet.id : undefined
  const date = typeof tweet.date === "string" ? tweet.date : ""
  const url =
    typeof tweet.url === "string" && tweet.url
      ? publicTweetUrl(tweet.url, username)
      : id
        ? `https://x.com/${username}/status/${id}`
        : ""
  return {
    id,
    text,
    date,
    url,
    link: url,
    authorName: typeof tweet.authorName === "string" ? tweet.authorName : undefined,
    username: typeof tweet.username === "string" ? tweet.username : username,
    profileImage: typeof tweet.profileImage === "string" ? tweet.profileImage : undefined,
  }
}

async function fetchJson(
  url: string,
  headers: Record<string, string>
): Promise<{ http: number; body: Record<string, unknown> }> {
  const res = await fetch(url, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(8000),
  })
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
  return { http: res.status, body }
}

async function fetchTweetsFromXApi(handle: string): Promise<PublicTweet[]> {
  const bearer = twitterBearer()
  if (!bearer) return []

  const headers = {
    Authorization: `Bearer ${bearer}`,
    "User-Agent": "Politeia/1.0",
  }

  const bases = ["https://api.twitter.com/2", "https://api.x.com/2"]
  for (const base of bases) {
    try {
      const userUrl = `${base}/users/by/username/${encodeURIComponent(handle)}?user.fields=name,username,profile_image_url`
      const userRes = await fetchJson(userUrl, headers)
      if (userRes.http === 429) {
        logTwitter({
          provider: "x-api",
          endpoint: "users_by_username",
          handle,
          http: 429,
          errorType: "rate_limited",
        })
        return []
      }
      if (userRes.http === 401 || userRes.http === 403) {
        logTwitter({
          provider: "x-api",
          endpoint: "users_by_username",
          handle,
          http: userRes.http,
          errorType: "unauthorized",
        })
        continue
      }
      const user = (userRes.body.data || null) as
        | { id?: string; name?: string; username?: string; profile_image_url?: string }
        | null
      if (userRes.http !== 200 || !user?.id) {
        logTwitter({
          provider: "x-api",
          endpoint: "users_by_username",
          handle,
          http: userRes.http,
          errorType: userRes.http === 200 ? "user_not_found" : `http_${userRes.http}`,
        })
        continue
      }

      const tweetsUrl = `${base}/users/${encodeURIComponent(user.id)}/tweets?max_results=5&tweet.fields=created_at`
      const tweetsRes = await fetchJson(tweetsUrl, headers)
      if (tweetsRes.http === 429) {
        logTwitter({
          provider: "x-api",
          endpoint: "user_tweets",
          handle,
          http: 429,
          errorType: "rate_limited",
        })
        return []
      }
      if (!tweetsRes.http || tweetsRes.http >= 400) {
        logTwitter({
          provider: "x-api",
          endpoint: "user_tweets",
          handle,
          http: tweetsRes.http,
          errorType: `http_${tweetsRes.http}`,
        })
        continue
      }

      const rows = Array.isArray(tweetsRes.body.data) ? tweetsRes.body.data : []
      const tweets: PublicTweet[] = []
      for (const row of rows) {
        const item = row as { id?: string; text?: string; created_at?: string }
        const normalized = normalizeTweet(
          {
            id: item.id,
            text: item.text,
            date: item.created_at,
            authorName: user.name,
            username: user.username || handle,
            profileImage: user.profile_image_url,
          },
          user.username || handle
        )
        if (normalized) tweets.push(normalized)
      }

      logTwitter({
        provider: "x-api",
        endpoint: "user_tweets",
        handle,
        http: tweetsRes.http,
        tweets: tweets.length,
      })
      return tweets
    } catch (err) {
      logTwitter({
        provider: "x-api",
        endpoint: "user_tweets",
        handle,
        errorType:
          err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
            ? "timeout"
            : "fetch_failed",
      })
    }
  }

  return []
}

function tweetsFromRssXml(xml: string, handle: string): PublicTweet[] {
  const tweets: PublicTweet[] = []
  const items = xml.split("<item>").slice(1)
  for (const item of items) {
    const titleMatch = item.match(/<title>([\s\S]*?)<\/title>/)
    const dateMatch = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)
    const linkMatch = item.match(/<link>([\s\S]*?)<\/link>/)
    if (!titleMatch) continue
    const text = decodeXml(titleMatch[1])
    if (!text) continue
    const url = linkMatch ? decodeXml(linkMatch[1]) : ""
    const normalized = normalizeTweet(
      {
        text,
        date: dateMatch ? decodeXml(dateMatch[1]) : "",
        url,
        username: handle,
      },
      handle
    )
    if (normalized) tweets.push(normalized)
    if (tweets.length >= 5) break
  }
  return tweets
}

async function fetchTweetsFromNitter(handle: string): Promise<PublicTweet[]> {
  for (const instance of NITTER_INSTANCES) {
    try {
      const res = await fetch(`${instance}/${handle}/rss`, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          Accept: "application/rss+xml, application/xml, text/xml",
        },
        cache: "no-store",
        signal: AbortSignal.timeout(4000),
      })
      if (!res.ok) {
        logTwitter({
          provider: "nitter",
          endpoint: "rss",
          handle,
          http: res.status,
          errorType: `http_${res.status}`,
        })
        continue
      }

      const xml = await res.text()
      let tweets: PublicTweet[] = []
      try {
        const feed = await rssParser.parseString(xml)
        const items = Array.isArray(feed.items) ? feed.items : []
        for (const item of items) {
          const text = decodeXml(String(item.title || item.contentSnippet || ""))
          const url = String(item.link || "")
          const normalized = normalizeTweet(
            {
              text,
              date: String(item.pubDate || item.isoDate || ""),
              url,
              username: handle,
            },
            handle
          )
          if (normalized) tweets.push(normalized)
          if (tweets.length >= 5) break
        }
      } catch {
        tweets = tweetsFromRssXml(xml, handle)
      }

      if (tweets.length > 0) {
        logTwitter({
          provider: "nitter",
          endpoint: "rss",
          handle,
          http: res.status,
          tweets: tweets.length,
        })
        return tweets
      }
    } catch (err) {
      logTwitter({
        provider: "nitter",
        endpoint: "rss",
        handle,
        errorType:
          err instanceof Error && (err.name === "TimeoutError" || err.name === "AbortError")
            ? "timeout"
            : "fetch_failed",
      })
    }
  }

  return []
}

export async function fetchTweetsForHandle(handle: string): Promise<PublicTweet[]> {
  const key = cleanHandle(handle)
  if (!key) return []

  const cached = cache[key]
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.tweets
  }

  try {
    const fromX = await fetchTweetsFromXApi(key)
    const tweets = fromX.length > 0 ? fromX : await fetchTweetsFromNitter(key)
    cache[key] = { tweets, timestamp: Date.now() }
    return tweets
  } catch {
    logTwitter({
      provider: "twitter",
      endpoint: "timeline",
      handle: key,
      errorType: "unhandled",
    })
    return []
  }
}
