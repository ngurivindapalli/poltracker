"use client"

import { useEffect, useState } from "react"
import NewsFeed from "./NewsFeed"

interface NewsFeedWithQueryProps {
  query: string
}

export default function NewsFeedWithQuery({ query }: NewsFeedWithQueryProps) {
  const [articles, setArticles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchNews() {
      try {
        const res = await fetch(`/api/news?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        // Map NewsAPI format to our component format
        const mappedArticles = (data.articles || []).map((article: any) => ({
          ...article,
          source: typeof article.source === 'object' ? article.source?.name || 'Unknown' : article.source || 'Unknown',
          publishedAt: article.publishedAt || article.published_at || new Date().toISOString()
        }))
        setArticles(mappedArticles)
      } catch (error) {
        console.error("Error fetching news:", error)
        setArticles([])
      } finally {
        setLoading(false)
      }
    }
    fetchNews()
  }, [query])

  if (loading) {
    return <div className="text-gray-500">Loading news...</div>
  }

  if (articles.length === 0) {
    return <div className="text-gray-500">No news found.</div>
  }

  return <NewsFeed articles={articles} />
}
