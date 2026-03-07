"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"

export default function Tweets({ handle }: { handle: string }) {
  const [tweets, setTweets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadTweets() {
      try {
        const res = await fetch(`/api/twitter/${handle}`)
        const data = await res.json()

        setTweets(data.tweets || [])
      } catch (e) {
        setTweets([])
      }

      setLoading(false)
    }

    loadTweets()
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
      <div className="text-[#64748B] text-sm p-4">
        No recent tweets available.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {tweets.map((tweet, i) => (
        <a
          key={i}
          href={tweet.url}
          target="_blank"
          rel="noopener noreferrer"
          className="block bg-white border rounded-xl p-4 shadow-sm hover:shadow-md transition"
        >
          <p>{tweet.text}</p>
          <div className="text-sm text-gray-500 mt-2">
            {new Date(tweet.date).toLocaleDateString()}
          </div>
        </a>
      ))}
    </div>
  )
}
