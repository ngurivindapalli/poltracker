"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { GLOBAL_LEADERS } from "@/data/globalLeaders";

type LeaderAssets = {
  name: string;
  country: string;
  currency: string;
  total: number | null;
  knownValue?: number | null;
  breakdown?: { label: string; value: number }[];
  type: "official" | "estimated" | "partial";
  source: string;
  lastUpdated?: string;
};

const TYPE_LABELS: Record<LeaderAssets["type"], string> = {
  official: "Official Disclosure",
  estimated: "Estimated Net Worth",
  partial: "Financial Interests Only",
};

function getTypeBadgeClass(
  type: LeaderAssets["type"]
): string {
  switch (type) {
    case "official":
      return "bg-green-100 text-green-800";
    case "estimated":
      return "bg-amber-100 text-amber-800";
    case "partial":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-muted text-muted-foreground";
  }
}

function formatSourceLine(assets: LeaderAssets): string {
  const label = TYPE_LABELS[assets.type ?? "partial"];
  const date = assets.lastUpdated;
  return date ? `${label} (${assets.source}, ${date})` : `${label} (${assets.source})`;
}

function formatCurrency(value: number, currency: string): string {
  if (currency === "INR") {
    const cr = value / 1e7;
    if (cr >= 1) return `₹${cr.toFixed(2)} Cr`;
    return `₹${value.toLocaleString("en-IN")}`;
  }
  if (currency === "USD") {
    if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
    return `$${value.toLocaleString()}`;
  }
  if (currency === "EUR" || currency === "GBP" || currency === "CAD") {
    const sym = { EUR: "€", GBP: "£", CAD: "C$" }[currency];
    if (value >= 1e9) return `${sym}${(value / 1e9).toFixed(1)}B`;
    if (value >= 1e6) return `${sym}${(value / 1e6).toFixed(1)}M`;
    if (value >= 1e3) return `${sym}${(value / 1e3).toFixed(1)}K`;
    return `${sym}${value.toLocaleString()}`;
  }
  return value.toLocaleString();
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

export default function GlobalLeaderPage({
  params,
}: {
  params: { slug: string };
}) {
  const leader = GLOBAL_LEADERS.find((l) => l.slug === params.slug);
  const [news, setNews] = useState<Article[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [assets, setAssets] = useState<LeaderAssets | null>(null);
  const [loadingNews, setLoadingNews] = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingAssets, setLoadingAssets] = useState(true);

  useEffect(() => {
    if (leader) {
      fetch(`/api/leader-news/${leader.slug}`)
        .then((r) => r.json())
        .then((data) => {
          setNews(data);
          setLoadingNews(false);
        })
        .catch(() => setLoadingNews(false));

      fetch(`/api/president-activity/${leader.slug}`)
        .then((r) => r.json())
        .then((data) => {
          setActivity(data);
          setLoadingActivity(false);
        })
        .catch(() => setLoadingActivity(false));

      fetch(`/api/global-assets/${leader.slug}`)
        .then((r) => r.json())
        .then((data) => {
          setAssets(data);
          setLoadingAssets(false);
        })
        .catch(() => {
          setAssets(null);
          setLoadingAssets(false);
        });
    }
  }, [leader]);

  if (!leader) {
    return (
      <main className="max-w-6xl mx-auto p-6">
        <Link
          href="/"
          className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
        >
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
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
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to Home
      </Link>

      {/* Leader Header */}
      <div className="bg-card border border-border rounded-2xl p-6 flex items-center gap-6 shadow-subtle flex-col md:flex-row md:items-start">
        <div className="relative w-32 h-32 flex-shrink-0">
          <Image
            src={leader.image || "/images/placeholder-avatar.svg"}
            alt={leader.name}
            fill
            className="rounded-full object-cover border-2 border-[#E2E8F0]"
          />
        </div>

        <div className="text-center md:text-left">
          <h1 className="text-2xl font-semibold">{leader.name}</h1>

          <p className="text-muted-foreground mt-1">{leader.title}</p>

          <p className="text-muted-foreground mt-1">{leader.country}</p>
        </div>
      </div>

      <section className="mt-10">
        <h2 className="text-xl font-semibold mb-4 inline-flex items-center gap-2">
          {leader.country === "United Kingdom"
            ? "Financial Interests"
            : "Assets"}
          <span
            className="text-[#94A3B8] cursor-help"
            title="Financial data availability varies by country. Some governments do not publish full asset disclosures."
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </span>
        </h2>

        <div className="section-card">
          {loadingAssets ? (
            <div className="text-muted-foreground py-4">Loading assets...</div>
          ) : assets ? (
            <>
              {leader.country === "United Kingdom" ? (
                assets.knownValue != null ? (
                  <>
                    <p className="text-muted-foreground text-sm mb-2">
                      This country does not publicly disclose full asset data.
                    </p>
                    <p className="text-2xl font-bold mb-2">
                      Known Value:{" "}
                      {formatCurrency(assets.knownValue, assets.currency)}
                    </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-4 ${getTypeBadgeClass(assets.type ?? "partial")}`}
                  >
                    {TYPE_LABELS[assets.type ?? "partial"]}
                    </span>
                    {assets.breakdown && assets.breakdown.length > 0 && (
                      <div className="space-y-2">
                        {assets.breakdown.map((item, i) => (
                          <div
                            key={i}
                            className="flex justify-between border-b border-[#E2E8F0] pb-1"
                          >
                            <span>{item.label}</span>
                            <span className="font-medium">
                              {formatCurrency(item.value, assets.currency)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="text-muted-foreground py-2">
                    Financial disclosures not publicly available
                  </p>
                )
              ) : assets.total != null ? (
                <>
                  <p className="text-2xl font-bold mb-2">
                    Total: {formatCurrency(assets.total, assets.currency)}
                  </p>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-0.5 rounded mb-4 ${getTypeBadgeClass(assets.type ?? "partial")}`}
                  >
                    {TYPE_LABELS[assets.type ?? "partial"]}
                  </span>
                  {assets.breakdown && assets.breakdown.length > 0 && (
                    <div className="space-y-2">
                      {assets.breakdown.map((item, i) => (
                        <div
                          key={i}
                          className="flex justify-between border-b border-[#E2E8F0] pb-1"
                        >
                          <span>{item.label}</span>
                          <span className="font-medium">
                            {formatCurrency(item.value, assets.currency)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground py-2">
                  Financial disclosures not publicly available
                </p>
              )}
              {assets && (
                <p className="text-xs text-muted-foreground mt-4">
                  {formatSourceLine(assets)}
                </p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground py-2">
              Financial disclosures not publicly available
            </p>
          )}
        </div>
      </section>

      {/* Recent News */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
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
                className="border border-border rounded-xl overflow-hidden hover:shadow-md transition bg-card"
              >
                <img
                  src={article.urlToImage || "/images/placeholder-avatar.svg"}
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
      <div className="bg-card rounded-xl border border-border shadow-sm p-6 mt-6">
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
                <div className="font-semibold text-[#1E3A5F]">{item.title}</div>

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
            {leader.slug === "donald-trump"
              ? "No recent policy activity available"
              : "Policy activity integration coming soon"}
          </div>
        )}
      </div>
    </main>
  );
}
