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

  useEffect(() => {
    fetch(`/api/tweets/${bioguideId}`)
      .then(res => res.json())
      .then(data => {
        setTweets(data)
        setLoading(false)
      })
      .catch(err => {
        console.error("Error fetching tweets:", err)
        setLoading(false)
      })
  }, [bioguideId])

  if (loading) {
    return (
      <div className="text-[#64748B] text-sm p-4">
        Loading tweets...
      </div>
    )
  }

  if (tweets.length === 0) {
    return null
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
              <a
                href={t.link}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[13px] font-medium text-[#2563EB] hover:underline"
              >
                View Tweet →
              </a>
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
