"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"

type Tweet = {
  text?: string
  date?: string
  url?: string
  link?: string
  username?: string
  authorName?: string
}

function formatTweetDate(value: string | undefined): string {
  if (!value) return ""
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return ""
  return parsed.toLocaleDateString()
}

export default function Tweets({ handle }: { handle: string }) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadTweets() {
      try {
        const res = await fetch(`/api/twitter/${encodeURIComponent(handle)}`, {
          cache: "no-store",
        })
        if (!res.ok) {
          if (!cancelled) setTweets([])
          return
        }
        const contentType = res.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          if (!cancelled) setTweets([])
          return
        }
        const data = await res.json()
        const list = Array.isArray(data?.tweets) ? data.tweets : []
        const normalized = list.filter(
          (tweet: Tweet) => tweet && typeof tweet.text === "string" && tweet.text.trim()
        )
        if (!cancelled) setTweets(normalized)
      } catch {
        if (!cancelled) setTweets([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadTweets()
    return () => {
      cancelled = true
    }
  }, [handle])

  if (loading) {
    return (
      <div className="text-[#64748B] text-sm p-4">
        Loading tweets...
      </div>
    )
  }

  if (!tweets.length) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Recent social activity unavailable.
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {tweets.map((tweet, i) => {
        try {
          const href = tweet.url || tweet.link
          const inner = (
            <>
              {(tweet.authorName || tweet.username) && (
                <div className="text-sm text-muted-foreground mb-1">
                  {tweet.authorName ? tweet.authorName : ""}
                  {tweet.username ? ` @${String(tweet.username).replace(/^@/, "")}` : ""}
                </div>
              )}
              <p>{tweet.text}</p>
              <div className="text-sm text-gray-500 mt-2">
                {formatTweetDate(tweet.date)}
              </div>
            </>
          )
          const className = "block bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
          if (href) {
            return (
              <a
                key={href || `${tweet.text}-${i}`}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {inner}
              </a>
            )
          }
          return (
            <div key={`${tweet.text}-${i}`} className={className}>
              {inner}
            </div>
          )
        } catch {
          return null
        }
      })}
    </div>
  )
}
