"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"

export default function Tweets({ handle }: { handle: string }) {
  const [tweets, setTweets] = useState<any[]>([])
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
        if (!cancelled) setTweets(Array.isArray(data?.tweets) ? data.tweets : [])
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
      {tweets.map((tweet, i) => (
        <a
          key={i}
          href={tweet.url || tweet.link}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
        >
          <p>{tweet.text}</p>
          <div className="text-sm text-gray-500 mt-2">
            {tweet.date ? new Date(tweet.date).toLocaleDateString() : ""}
          </div>
        </a>
      ))}
    </div>
  )
}
