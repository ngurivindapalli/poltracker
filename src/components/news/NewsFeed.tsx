"use client";

import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Article {
  title: string;
  summary?: string;
  description?: string;
  source: string | { name?: string };
  url: string;
  publishedAt: string;
  urlToImage?: string;
}

interface NewsFeedProps {
  articles: Article[];
}

export default function NewsFeed({ articles }: NewsFeedProps) {
  if (!articles || articles.length === 0) return null;

  function formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric"
      }).format(date);
    } catch {
      return "";
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {articles.map((article, index) => (
        <a 
          key={index} 
          href={article.url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="group h-full"
        >
          <Card className="h-full flex flex-col overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg p-0">
            {article.urlToImage && (
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={article.urlToImage}
                  alt={article.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>
            )}
            
            <div className="p-5 flex flex-col flex-grow">
              <div className="flex items-center justify-between mb-3">
                <Badge variant="neutral" className="text-[11px] px-2">
                  {typeof article.source === 'object' ? article.source?.name : article.source}
                </Badge>
                <span className="text-[12px] text-[#94A3B8]">
                  {formatDate(article.publishedAt)}
                </span>
              </div>
              
              <h3 className="text-[18px] font-bold text-[#1E3A5F] mb-3 leading-snug group-hover:text-[#2563EB] transition-colors line-clamp-3">
                {article.title}
              </h3>
              
              {(article.summary || article.description) && (
                <p className="text-[14px] text-[#64748B] line-clamp-4 leading-relaxed flex-grow">
                  {article.summary || article.description}
                </p>
              )}
              
              <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex justify-end">
                <span className="text-[13px] font-semibold text-[#2563EB] flex items-center gap-1">
                  Read Article
                  <svg className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </div>
          </Card>
        </a>
      ))}
    </div>
  );
}
