"use client"

import { Suspense, useState, useEffect } from "react"
import { Card } from "@/components/ui/Card"
import { useNewsSourceSelection } from "@/hooks/useNewsSourceSelection"
import { NewsSourceFilter } from "./NewsSourceFilter"
import {
  DEFAULT_NEWS_SOURCE_IDS,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
  isDefaultNewsSourceSelection,
} from "@/lib/newsSources"

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

function OfficialNewsFeedContent({
  bioguideId,
  defaultMode = "aligned",
}: OfficialNewsFeedProps) {
  const [mode, setMode] = useState<"aligned" | "balanced" | "opposing">(defaultMode)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { selectedIds, setSelectedIds, ready } = useNewsSourceSelection()

  const effectiveIds =
    selectedIds.length > 0 ? selectedIds : DEFAULT_NEWS_SOURCE_IDS

  useEffect(() => {
    if (!ready) return

    async function fetchNews() {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          bioguideId,
          mode,
        })
        if (!isDefaultNewsSourceSelection(effectiveIds)) {
          params.set("sources", buildNewsApiSourcesQueryParam(effectiveIds))
        }

        const response = await fetch(`/api/news/official?${params.toString()}`, {
          cache: "no-store",
        })

        if (!response.ok) {
          throw new Error("Failed to fetch news")
        }

        const data = await response.json()
        let list: Article[] = data.articles || []
        if (!isDefaultNewsSourceSelection(effectiveIds)) {
          const wrapped = list.map((a) => ({
            title: a.title,
            description: a.description,
            url: a.url,
            publishedAt: a.publishedAt,
            imageUrl: a.imageUrl,
            source: {
              name: a.source,
              id: (a as Article & { sourceId?: string }).sourceId,
            },
          }))
          const filtered = filterArticlesBySourceIds(wrapped, effectiveIds)
          list = filtered.map((a) => ({
            title: a.title,
            description: a.description ?? "",
            url: a.url,
            source:
              typeof a.source === "object" && a.source && "name" in a.source
                ? (a.source as { name?: string }).name ?? ""
                : String(a.source ?? ""),
            publishedAt: a.publishedAt,
            imageUrl: a.imageUrl,
          }))
        }
        setArticles(list)
      } catch (err) {
        console.error("Error fetching official news:", err)
        setError("Unable to load news. Please try again.")
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    fetchNews()
  }, [bioguideId, mode, ready, effectiveIds, selectedIds])

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString)
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date)
    } catch {
      return ""
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-foreground">Choose news sources</p>
      <NewsSourceFilter value={selectedIds} onChange={setSelectedIds} />

      <div className="flex bg-muted p-1 rounded-lg border border-border">
        <button
          type="button"
          onClick={() => setMode("aligned")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "aligned"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Aligned
        </button>
        <button
          type="button"
          onClick={() => setMode("balanced")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "balanced"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Balanced
        </button>
        <button
          type="button"
          onClick={() => setMode("opposing")}
          className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all flex-1 ${
            mode === "opposing"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Opposing
        </button>
      </div>

      {loading ? (
        <Card className="p-6 text-center text-muted-foreground italic">
          Loading news feed...
        </Card>
      ) : error ? (
        <Card className="p-6 text-center bg-destructive/10 border-destructive/30 text-destructive">
          {error}
        </Card>
      ) : articles.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground italic">
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
              <Card className="p-4 hover:shadow-sm transition-all border-border hover:border-primary/40 group-hover:translate-x-0.5">
                {article.imageUrl ? (
                  <div className="mb-3 overflow-hidden rounded-lg border border-border">
                    <img
                      src={article.imageUrl}
                      alt=""
                      className="h-36 w-full object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wide">
                    {article.source}
                  </span>
                  <span className="text-[11px] text-muted-foreground shrink-0">
                    {formatDate(article.publishedAt)}
                  </span>
                </div>
                <h3 className="text-[15px] font-semibold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors line-clamp-3">
                  {article.title}
                </h3>
                {article.description ? (
                  <p className="text-[13px] text-muted-foreground line-clamp-2 mb-2">
                    {article.description}
                  </p>
                ) : null}
                <div className="flex items-center text-[12px] text-primary font-medium mt-2">
                  Read Article
                  <svg
                    className="w-3 h-3 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
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

export default function OfficialNewsFeed(props: OfficialNewsFeedProps) {
  return (
    <Suspense
      fallback={
        <Card className="p-6 text-center text-muted-foreground">
          Loading news...
        </Card>
      }
    >
      <OfficialNewsFeedContent {...props} />
    </Suspense>
  )
}
