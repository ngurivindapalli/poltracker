"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"

interface Article {
  title: string
  description?: string
  url: string
  source: string | { name?: string }
  publishedAt: string
  urlToImage?: string
}

interface InternationalNewsFeedProps {
  query: string
  title?: string
}

function formatDate(dateString: string): string {
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(dateString))
  } catch {
    return ""
  }
}

export function InternationalNewsFeed({ query, title = "Latest News" }: InternationalNewsFeedProps) {
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchNews() {
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({ q: query })
        const res = await fetch(`/api/news?${params.toString()}`, { cache: "no-store" })
        if (!res.ok) throw new Error("Failed to fetch news")
        const data = await res.json()
        setArticles(data.articles || [])
      } catch {
        setError("Unable to load news. Check your NEWS_API_KEY configuration.")
        setArticles([])
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [query])

  const sourceName = (s: string | { name?: string }): string =>
    typeof s === "object" ? s?.name ?? "" : s

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <div className="h-4 bg-muted rounded w-3/4 mb-3" />
              <div className="h-3 bg-muted rounded w-full mb-2" />
              <div className="h-3 bg-muted rounded w-2/3" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="p-6 text-center text-sm text-muted-foreground border-border/50">
          {error}
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground">
          No articles found. Verify your NEWS_API_KEY is configured.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {articles.map((article, i) => (
            <a
              key={i}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block"
            >
              <Card className="h-full flex flex-col overflow-hidden p-0 transition-all group-hover:-translate-y-0.5 group-hover:shadow-md group-hover:border-primary/40">
                {article.urlToImage && (
                  <div className="h-40 overflow-hidden bg-muted">
                    <img
                      src={article.urlToImage}
                      alt=""
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                  </div>
                )}
                <div className="p-4 flex flex-col flex-grow">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide truncate">
                      {sourceName(article.source)}
                    </span>
                    <span className="text-[11px] text-muted-foreground shrink-0">
                      {formatDate(article.publishedAt)}
                    </span>
                  </div>
                  <h4 className="text-[14px] font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3 flex-grow">
                    {article.title}
                  </h4>
                  {article.description && (
                    <p className="text-[12px] text-muted-foreground line-clamp-2 leading-relaxed">
                      {article.description}
                    </p>
                  )}
                  <div className="mt-3 flex items-center text-[12px] text-primary font-medium">
                    Read more
                    <svg className="w-3 h-3 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
