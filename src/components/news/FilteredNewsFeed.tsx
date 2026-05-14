"use client"

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  DEFAULT_NEWS_SOURCE_IDS,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
} from "@/lib/newsSources"
import { NewsSourceFilter } from "./NewsSourceFilter"
import NewsFeed from "./NewsFeed"
import { Card } from "@/components/ui/Card"
import { useNewsSourceSelection } from "@/hooks/useNewsSourceSelection"

function mapForNewsFeed(raw: any[]) {
  return raw.map((a) => ({
    title: a.title ?? "",
    summary: a.summary ?? a.description,
    description: a.description ?? "",
    url: a.url,
    publishedAt: a.publishedAt ?? a.published_at ?? "",
    urlToImage: a.urlToImage ?? a.imageUrl,
    source:
      typeof a.source === "object" && a.source
        ? a.source
        : { name: String(a.source ?? "Unknown") },
  }))
}

export type FilteredNewsFeedProps = {
  /** Called with comma-separated source ids for the `sources` query param; use effective list (never empty) */
  buildApiUrl: (sourcesParam: string) => string
  /** Optional title above the filter */
  title?: string
  className?: string
  /** Refetch when these values change (e.g. scope, location) */
  reloadDeps?: unknown[]
}

export function FilteredNewsFeed({
  buildApiUrl,
  title,
  className = "",
  reloadDeps = [],
}: FilteredNewsFeedProps) {
  const { selectedIds, setSelectedIds, ready } = useNewsSourceSelection()
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const depSignature = JSON.stringify(reloadDeps)

  const effectiveSourceIds = useMemo(
    () => (selectedIds.length > 0 ? selectedIds : DEFAULT_NEWS_SOURCE_IDS),
    [selectedIds]
  )

  const sourcesParam = useMemo(
    () => buildNewsApiSourcesQueryParam(effectiveSourceIds),
    [effectiveSourceIds]
  )

  const fetchArticles = useCallback(async () => {
    if (!ready) return
    setLoading(true)
    setError(null)
    try {
      const url = buildApiUrl(sourcesParam)
      const res = await fetch(url, { cache: "no-store" })
      if (!res.ok) throw new Error("Request failed")
      const data = await res.json()
      const raw = data.articles ?? data ?? []
      const list = Array.isArray(raw) ? raw : []
      const filtered = filterArticlesBySourceIds(list, effectiveSourceIds)
      setArticles(mapForNewsFeed(filtered))
    } catch {
      setError("Unable to load news right now.")
      setArticles([])
    } finally {
      setLoading(false)
    }
  }, [buildApiUrl, effectiveSourceIds, ready, sourcesParam])

  useEffect(() => {
    if (!ready) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void fetchArticles()
    }, 250)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [ready, fetchArticles, sourcesParam, depSignature, selectedIds])

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      )}
      <p className="text-sm font-medium text-foreground">Choose news sources</p>
      <NewsSourceFilter value={selectedIds} onChange={setSelectedIds} />
      {loading ? (
        <Card className="p-6 text-center text-muted-foreground">Loading news…</Card>
      ) : error ? (
        <Card className="p-6 text-center text-destructive border-destructive/30">{error}</Card>
      ) : articles.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No articles for this query and source selection.
        </Card>
      ) : (
        <NewsFeed articles={articles} />
      )}
    </div>
  )
}

export function FilteredNewsFeedSuspended(props: FilteredNewsFeedProps) {
  return (
    <Suspense
      fallback={
        <Card className="p-6 text-center text-muted-foreground">
          Loading news…
        </Card>
      }
    >
      <FilteredNewsFeed {...props} />
    </Suspense>
  )
}
