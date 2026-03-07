"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"

type Article = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  imageUrl?: string | null
}

type OfficialNewsFeedProps = {
  bioguideId: string
  defaultMode?: "aligned" | "balanced" | "opposing"
}

export default function OfficialNewsFeed({ 
  bioguideId, 
  defaultMode = "aligned" 
}: OfficialNewsFeedProps) {
  const [mode, setMode] = useState<"aligned" | "balanced" | "opposing">(defaultMode)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          bioguideId,
          mode
        })

        const response = await fetch(`/api/news/official?${params.toString()}`)

        if (!response.ok) {
          throw new Error("Failed to fetch news")
        }

        const data = await response.json()
        setArticles(data.articles || [])
      } catch (err) {
        console.error("Error fetching official news:", err)
        setError("Unable to load news. Please try again.")
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [bioguideId, mode])

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date)
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
        <button
          onClick={() => setMode("aligned")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "aligned"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-[#64748B] hover:text-[#1E3A5F]"
          }`}
        >
          Aligned
        </button>
        <button
          onClick={() => setMode("balanced")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "balanced"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-[#64748B] hover:text-[#1E3A5F]"
          }`}
        >
          Balanced
        </button>
        <button
          onClick={() => setMode("opposing")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "opposing"
              ? "bg-white text-[#1E3A5F] shadow-sm"
              : "text-[#64748B] hover:text-[#1E3A5F]"
          }`}
        >
          Opposing
        </button>
      </div>

      {loading ? (
        <Card className="p-6 text-center text-[#64748B] italic">
          Loading news feed...
        </Card>
      ) : error ? (
        <Card className="p-6 text-center bg-red-50 border-red-100 text-red-600">
          {error}
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-6 text-center text-[#64748B] italic">
          No {mode} coverage found. Try Balanced.
        </Card>
      ) : (
        <div className="space-y-4">
          {articles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block group"
            >
              <Card className="p-4 hover:shadow-sm transition-all border-[#E2E8F0] hover:border-[#2563EB] group-hover:translate-x-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">
                    {article.source}
                  </span>
                  <span className="text-[11px] text-[#94A3B8]">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-[#1E3A5F] leading-snug mb-2 group-hover:text-[#2563EB] transition-colors line-clamp-3">
                  {article.title}
                </h3>
                {article.description && (
                  <p className="text-[13px] text-[#64748B] line-clamp-2 mb-2">
                    {article.description}
                  </p>
                )}
                <div className="flex items-center text-[12px] text-[#2563EB] font-medium mt-2">
                  Read Article
                  <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
