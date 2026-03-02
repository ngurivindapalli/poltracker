'use client'

import { FamilyNewsArticle } from '@/lib/news/familyNewsProvider'

interface FamilyNewsPanelProps {
  memberName: string
  relation: string
  news: FamilyNewsArticle[]
  onClose: () => void
}

export default function FamilyNewsPanel({ memberName, relation, news, onClose }: FamilyNewsPanelProps) {
  if (news.length === 0) {
    return (
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">{memberName}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
            >
              ×
            </button>
          </div>
          <p className="text-sm text-gray-500 mb-4">{relation}</p>
          <div className="text-center py-8 text-gray-500">
            No recent news found
          </div>
        </div>
      </div>
    )
  }

  // Sort by published date (newest first)
  const sortedNews = [...news].sort((a, b) => {
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  })

  return (
    <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl border-l border-gray-200 z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">{memberName}</h3>
            <p className="text-sm text-gray-500">{relation}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {news.length} {news.length === 1 ? 'article' : 'articles'}
          </span>
        </div>

        <div className="space-y-4">
          {sortedNews.map((article, index) => (
            <a
              key={index}
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all"
            >
              <h4 className="font-medium text-sm mb-2 line-clamp-2">{article.headline}</h4>
              <div className="flex justify-between items-center text-xs text-gray-500">
                <span>{article.source}</span>
                <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
