'use client'

import { useState, useEffect } from 'react'
import CredibilityInfo from './CredibilityInfo'

type Article = {
  title: string
  description: string
  url: string
  source: string
  publishedAt: string
  _metadata?: {
    sourceId: string
    weight: number
    isPrimary: boolean
  }
}

type NewsSectionProps = {
  bioguideId: string
  initialArticles: Article[]
  initialSourceType: string
  isStatePage?: boolean
}

type SortOption = 'credibility' | 'date' | 'none'

export default function NewsSection({ bioguideId, initialArticles, initialSourceType, isStatePage = false }: NewsSectionProps) {
  const [coverage, setCoverage] = useState<'major' | 'all'>(initialSourceType === 'all' ? 'all' : 'major')
  const [sortBy, setSortBy] = useState<SortOption>('credibility')
  const [articles, setArticles] = useState<Article[]>(initialArticles)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch news when filters change (only for senator pages, not state pages)
  useEffect(() => {
    if (isStatePage) {
      // On state pages, we don't refetch - just use initial articles
      return
    }

    const fetchNews = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams()
        params.set('coverage', coverage)
        params.set('sort', sortBy)

        const response = await fetch(`/api/senator/${bioguideId}/news?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error('Failed to fetch news')
        }

        const data = await response.json()
        setArticles(data.articles || [])
      } catch (err) {
        console.error('Error fetching news:', err)
        setError('Unable to load news. Please try again.')
        setArticles([])
      } finally {
        setLoading(false)
      }
    }

    // Only fetch if filters changed from initial state
    if (coverage !== (initialSourceType === 'all' ? 'all' : 'major') || sortBy !== 'credibility') {
      fetchNews()
    }
  }, [coverage, sortBy, bioguideId, initialSourceType, isStatePage])

  // Sort articles client-side based on selected option
  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === 'date') {
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA // Newest first
    } else if (sortBy === 'credibility') {
      // Sort by credibility weight (if metadata available)
      const weightA = a._metadata?.weight ?? 0.5
      const weightB = b._metadata?.weight ?? 0.5
      if (weightB !== weightA) return weightB - weightA
      // Secondary sort by date
      const dateA = new Date(a.publishedAt).getTime()
      const dateB = new Date(b.publishedAt).getTime()
      return dateB - dateA
    }
    // 'none' - return in original order
    return 0
  })

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-primary">Recent News</h2>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-muted">
              {coverage === 'major' ? 'Major News Coverage' : 'All News Coverage'}
            </span>
            <CredibilityInfo />
          </div>
        </div>
        
        {!isStatePage && (
          <div className="flex flex-wrap items-center gap-3">
            {/* Coverage Toggle */}
            <div className="flex items-center gap-2 rounded-lg border border-border bg-white p-1">
              <button
                onClick={() => setCoverage('major')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors rounded ${
                  coverage === 'major'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-background'
                }`}
              >
                Major
              </button>
              <button
                onClick={() => setCoverage('all')}
                className={`px-3 py-1.5 text-sm font-medium transition-colors rounded ${
                  coverage === 'all'
                    ? 'bg-primary text-white'
                    : 'text-muted hover:bg-background'
                }`}
              >
                All
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-medium text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-1 transition-colors"
            >
              <option value="credibility">Sort by Credibility</option>
              <option value="date">Sort by Date</option>
              <option value="none">No Sort</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
          Loading news...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          {error}
        </div>
      ) : sortedArticles.length === 0 ? (
        <div className="rounded-xl border border-border bg-background p-4 text-sm text-muted">
          No recent news found.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedArticles.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-hover block rounded-xl border border-border bg-white p-5"
            >
              <div className="font-semibold text-primary leading-snug">
                {article.title || 'Untitled'}
              </div>
              {article.description && (
                <div className="mt-3 text-sm text-muted line-clamp-2 leading-relaxed">
                  {article.description}
                </div>
              )}
              <div className="mt-4 flex items-center gap-3 text-xs text-muted">
                {article.source && (
                  <span className="font-medium">{article.source}</span>
                )}
                {article.publishedAt && (
                  <span>
                    {new Date(article.publishedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </section>
  )
}
