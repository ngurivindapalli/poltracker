"use client";

import { useState, useEffect } from "react";
import CredibilityInfo from "./CredibilityInfo";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type Article = {
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  urlToImage?: string;
  _metadata?: {
    sourceId: string;
    weight: number;
    isPrimary: boolean;
  };
};

type NewsSectionProps = {
  bioguideId: string;
  initialArticles: Article[];
  initialSourceType: string;
  isStatePage?: boolean;
};

type SortOption = "credibility" | "date";

export default function NewsSection({
  bioguideId,
  initialArticles,
  initialSourceType,
  isStatePage = false,
}: NewsSectionProps) {
  const [coverage, setCoverage] = useState<"major" | "all">(
    initialSourceType === "all" ? "all" : "major"
  );
  const [sortBy, setSortBy] = useState<SortOption>("credibility");
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isStatePage) return;

    const fetchNews = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("coverage", coverage);
        params.set("sort", sortBy);

        const response = await fetch(
          `/api/senator/${bioguideId}/news?${params.toString()}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch news");
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error("Error fetching news:", err);
        setError("Unable to load news. Please try again.");
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    if (
      coverage !== (initialSourceType === "all" ? "all" : "major") ||
      sortBy !== "credibility"
    ) {
      fetchNews();
    }
  }, [coverage, sortBy, bioguideId, initialSourceType, isStatePage]);

  const sortedArticles = [...articles].sort((a, b) => {
    if (sortBy === "date") {
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    } else if (sortBy === "credibility") {
      const weightA = a._metadata?.weight ?? 0.5;
      const weightB = b._metadata?.weight ?? 0.5;
      if (weightB !== weightA) return weightB - weightA;
      const dateA = new Date(a.publishedAt).getTime();
      const dateB = new Date(b.publishedAt).getTime();
      return dateB - dateA;
    }
    return 0;
  });

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
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
           <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                <button
                onClick={() => setCoverage("major")}
                className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                    coverage === "major"
                    ? "bg-white text-[#1E3A5F] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E3A5F]"
                }`}
                >
                Major
                </button>
                <button
                onClick={() => setCoverage("all")}
                className={`px-3 py-1 text-[12px] font-medium rounded-md transition-all ${
                    coverage === "all"
                    ? "bg-white text-[#1E3A5F] shadow-sm"
                    : "text-[#64748B] hover:text-[#1E3A5F]"
                }`}
                >
                All
                </button>
            </div>
            <CredibilityInfo />
        </div>
      </div>

      {loading ? (
        <Card className="p-6 text-center text-[#64748B] italic">
          Updating news feed...
        </Card>
      ) : error ? (
        <Card className="p-6 text-center bg-red-50 border-red-100 text-red-600">
          {error}
        </Card>
      ) : sortedArticles.length === 0 ? (
        <Card className="p-6 text-center text-[#64748B] italic">
          No recent news found.
        </Card>
      ) : (
        <div className="space-y-4">
          {sortedArticles.map((article, index) => (
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
  );
}
