"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/Card"

interface Tweet {
  text: string
  link: string
  date: string
}

interface MemberTweetsProps {
  bioguideId: string
}

export default function MemberTweets({ bioguideId }: MemberTweetsProps) {
  const [tweets, setTweets] = useState<Tweet[]>([])
  const [loading, setLoading] = useState(true)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setUnavailable(false)
      try {
        const res = await fetch(`/api/tweets/${encodeURIComponent(bioguideId)}`, {
          cache: "no-store",
        })
        if (!res.ok) {
          if (!cancelled) {
            setTweets([])
            setUnavailable(true)
          }
          return
        }
        const contentType = res.headers.get("content-type") || ""
        if (!contentType.includes("application/json")) {
          if (!cancelled) {
            setTweets([])
            setUnavailable(true)
          }
          return
        }
        const data = await res.json()
        const list = Array.isArray(data) ? data : Array.isArray(data?.tweets) ? data.tweets : []
        const normalized: Tweet[] = list
          .map((t: { text?: string; link?: string; url?: string; date?: string }) => ({
            text: t.text || "",
            link: t.link || t.url || "",
            date: t.date || "",
          }))
          .filter((t: Tweet) => t.text)
        if (!cancelled) {
          setTweets(normalized)
          setUnavailable(normalized.length === 0)
        }
      } catch {
        if (!cancelled) {
          setTweets([])
          setUnavailable(true)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [bioguideId])

  if (loading) {
    return (
      <div className="text-[#64748B] text-sm p-4">
        Loading tweets...
      </div>
    )
  }

  if (unavailable || tweets.length === 0) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        Recent social activity unavailable.
      </Card>
    )
  }

  return (
    <div>
      <h3 className="text-xl font-semibold text-[#1E3A5F] mb-4">
        Latest Tweets
      </h3>
      <div className="space-y-3">
        {tweets.map((t, i) => (
          <Card key={i} className="p-4 hover:border-[#2563EB] transition-colors">
            <p className="text-[15px] text-[#334155] mb-3 leading-relaxed">
              {t.text}
            </p>
            <div className="flex items-center justify-between">
              {t.link ? (
                <a
                  href={t.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[13px] font-medium text-[#2563EB] hover:underline"
                >
                  View Tweet →
                </a>
              ) : (
                <span />
              )}
              {t.date && (
                <span className="text-[12px] text-[#94A3B8]">
                  {new Date(t.date).toLocaleDateString()}
                </span>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
