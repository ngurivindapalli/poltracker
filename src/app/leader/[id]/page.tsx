"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import leaders from "@/data/global-leaders.json";
import LeaderImage from "@/components/LeaderImage";

interface Leader {
  id: string;
  name: string;
  title: string;
  country: string;
  party: string;
  image: string;
}

interface Article {
  url: string;
  urlToImage?: string;
  title: string;
  source?: {
    name?: string;
  };
}

interface ActivityItem {
  document_number: string;
  title: string;
  publication_date: string;
  html_url: string;
}

export default function LeaderPage({ params }: { params: { id: string } }) {
  const leader = leaders.find((l: Leader) => l.id === params.id);
  const [news, setNews] = useState<Article[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (leader) {
      // Fetch news
      fetch(`/api/leader-news/${leader.id}`)
        .then(r => r.json())
        .then(data => {
          setNews(data);
          setLoadingNews(false);
        })
        .catch(() => setLoadingNews(false));

      // Fetch policy activity
      fetch(`/api/president-activity/${leader.id}`)
        .then(r => r.json())
        .then(data => {
          setActivity(data);
          setLoadingActivity(false);
        })
        .catch(() => setLoadingActivity(false));
    }
  }, [leader]);

  if (!leader) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <Link
          href="/"
          className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Home
        </Link>
        <div className="bg-red-50 border border-red-100 rounded-xl p-12 text-center">
          <h2 className="text-xl font-bold text-red-800">Leader not found</h2>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto p-6">
      <Link
        href="/"
        className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </Link>

      {/* Leader Header */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 flex flex-col md:flex-row gap-6 items-center md:items-start">
        <LeaderImage
          src={leader.image}
          name={leader.name}
          size="w-32 h-32"
        />

        <div className="text-center md:text-left">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">
            {leader.name}
          </h1>

          <div className="text-[#64748B] mt-1">
            {leader.title}
          </div>

          <div className="text-[#94A3B8] mt-1">
            {leader.country}
          </div>

          <div className="mt-2 inline-block px-3 py-1 bg-[#F1F5F9] text-[#334155] rounded-full text-sm font-medium">
            {leader.party}
          </div>
        </div>
      </div>

      {/* Recent News */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mt-6">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-6">
          Recent News
        </h2>

        {loadingNews ? (
          <div className="text-[#64748B] text-center py-8">
            Loading news...
          </div>
        ) : news.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {news.map((article) => (
              <div
                key={article.url}
                className="border border-[#E2E8F0] rounded-xl overflow-hidden hover:shadow-md transition bg-white"
              >
                <img
                  src={article.urlToImage || "/default-avatar.svg"}
                  alt={article.title}
                  className="w-full h-48 object-cover bg-[#F1F5F9]"
                />

                <div className="p-4">
                  <div className="text-sm text-[#94A3B8]">
                    {article.source?.name}
                  </div>

                  <div className="font-semibold text-[#1E3A5F] mt-1 line-clamp-2">
                    {article.title}
                  </div>

                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#2563EB] text-sm mt-3 inline-block hover:underline"
                  >
                    Read Article →
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#64748B] text-center py-8 italic">
            No recent news available
          </div>
        )}
      </div>

      {/* Policy Activity */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-6 mt-6">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Policy Activity
        </h2>

        {loadingActivity ? (
          <div className="text-[#64748B] text-center py-8">
            Loading activity...
          </div>
        ) : activity.length > 0 ? (
          <div className="space-y-3">
            {activity.map((item) => (
              <div
                key={item.document_number}
                className="border border-[#E2E8F0] rounded-lg p-4 hover:bg-[#F8FAFC] transition"
              >
                <div className="font-semibold text-[#1E3A5F]">
                  {item.title}
                </div>

                <div className="text-sm text-[#64748B] mt-1">
                  {item.publication_date}
                </div>

                <a
                  href={item.html_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#2563EB] text-sm mt-2 inline-block hover:underline"
                >
                  View Document →
                </a>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-[#64748B] italic">
            {leader.id === "trump" 
              ? "No recent policy activity available"
              : "Policy activity integration coming soon"
            }
          </div>
        )}
      </div>
    </main>
  );
}
