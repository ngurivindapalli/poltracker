"use client";

import { Suspense, useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import NewsFeed from "@/components/news/NewsFeed";
import { useNewsSourceSelection } from "@/hooks/useNewsSourceSelection";
import { NewsSourceFilter } from "@/components/news/NewsSourceFilter";
import {
  DEFAULT_NEWS_SOURCE_IDS,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
} from "@/lib/newsSources";

interface CountySelectorProps {
  stateCode: string;
  stateName: string;
  counties?: string[]; // Optional - fetched client-side when not provided
}

interface LocalElection {
  title: string;
  date: string;
  description: string;
  type?: string;
}

interface LocalEvent {
  title: string;
  date: string;
  location: string;
  description?: string;
  type?: string;
}

interface Article {
  title: string;
  description: string;
  source: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
}

function CountySelectorInner({
  stateCode,
  stateName,
  counties: countiesProp,
}: CountySelectorProps) {
  const [counties, setCounties] = useState<string[]>(countiesProp || []);
  const [selectedCounty, setSelectedCounty] = useState<string>("");
  const [news, setNews] = useState<Article[]>([]);
  const [elections, setElections] = useState<LocalElection[]>([]);
  const [events, setEvents] = useState<LocalEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [countiesLoading, setCountiesLoading] = useState(
    !countiesProp || countiesProp.length === 0
  );
  const { selectedIds, setSelectedIds, ready } = useNewsSourceSelection();
  const effectiveIds =
    selectedIds.length > 0 ? selectedIds : DEFAULT_NEWS_SOURCE_IDS;

  // Lazy-load counties when not provided (client-side only)
  useEffect(() => {
    if (countiesProp && countiesProp.length > 0) {
      setCounties(countiesProp);
      setCountiesLoading(false);
      return;
    }
    async function fetchCounties() {
      try {
        const res = await fetch(`/api/counties/${stateCode}`);
        const data = await res.json();
        setCounties(data.counties || []);
      } catch {
        setCounties([]);
      } finally {
        setCountiesLoading(false);
      }
    }
    fetchCounties();
  }, [stateCode, countiesProp]);

  useEffect(() => {
    if (!selectedCounty || !ready) return;

    async function fetchLocalData() {
      setLoading(true);

      const sources = encodeURIComponent(
        buildNewsApiSourcesQueryParam(effectiveIds)
      );

      try {
        const newsRes = await fetch(
          `/api/localNews?state=${encodeURIComponent(
            stateName
          )}&county=${encodeURIComponent(selectedCounty)}&sources=${sources}`
        );
        const newsData = await newsRes.json();
        const raw: Article[] = newsData.articles || [];
        const filtered = filterArticlesBySourceIds(
          raw.map((a) => ({
            ...a,
            source: { name: a.source },
          })),
          effectiveIds
        ).map((a: any) => ({
          title: a.title,
          description: a.description,
          source:
            typeof a.source === "object"
              ? a.source?.name ?? "Unknown"
              : String(a.source),
          url: a.url,
          urlToImage: a.urlToImage,
          publishedAt: a.publishedAt,
        }));
        setNews(filtered);
      } catch {
        setNews([]);
      }

      try {
        const [electionsModule, eventsModule] = await Promise.all([
          import("@/lib/localData/elections"),
          import("@/lib/localData/events"),
        ]);

        setElections(
          electionsModule.getElectionsForCounty(stateName, selectedCounty)
        );
        setEvents(eventsModule.getEventsForCounty(stateName, selectedCounty));
      } catch {
        setElections([]);
        setEvents([]);
      }

      setLoading(false);
    }

    fetchLocalData();
  }, [
    selectedCounty,
    stateName,
    effectiveIds,
    ready,
    selectedIds,
  ]);

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  }

  return (
    <div className="space-y-8">
      {/* County Selector */}
      <Card className="p-6">
        <h3 className="text-[18px] font-bold text-foreground mb-4">
          Select County for Local Information
        </h3>
        <select
          value={selectedCounty}
          onChange={(e) => setSelectedCounty(e.target.value)}
          className="w-full max-w-md h-[44px] px-4 rounded-[8px] border border-border bg-background text-foreground text-[15px] focus:outline-none focus:ring-2 focus:ring-primary"
          disabled={countiesLoading}
        >
          <option value="">
            {countiesLoading ? "Loading counties..." : "— Select a County —"}
          </option>
          {counties.map((county) => (
            <option key={county} value={county}>
              {county}
            </option>
          ))}
        </select>
      </Card>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center text-muted-foreground">
          Loading local information for {selectedCounty}...
        </Card>
      )}

      {/* County Data Display */}
      {selectedCounty && !loading && (
        <div className="space-y-8">
          {/* Local Elections */}
          <div>
            <h3 className="text-[20px] font-bold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              Upcoming Elections in {selectedCounty}
            </h3>
            {elections.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {elections.map((election, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="success">
                        {election.type || "Election"}
                      </Badge>
                      <span className="text-[13px] text-muted-foreground">
                        {formatDate(election.date)}
                      </span>
                    </div>
                    <h4 className="text-[16px] font-bold text-foreground mb-2">
                      {election.title}
                    </h4>
                    <p className="text-[14px] text-muted-foreground leading-relaxed">
                      {election.description}
                    </p>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground italic bg-muted/20">
                No upcoming elections scheduled for {selectedCounty}.
              </Card>
            )}
          </div>

          {/* Local Events */}
          <div>
            <h3 className="text-[20px] font-bold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Important Local Events
            </h3>
            {events.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {events.map((event, i) => (
                  <Card key={i} className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <Badge variant="default">{event.type || "Event"}</Badge>
                      <span className="text-[13px] text-muted-foreground">
                        {formatDate(event.date)}
                      </span>
                    </div>
                    <h4 className="text-[16px] font-bold text-foreground mb-2">
                      {event.title}
                    </h4>
                    <p className="text-[13px] text-muted-foreground mb-2 flex items-center gap-1">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {event.location}
                    </p>
                    {event.description && (
                      <p className="text-[14px] text-muted-foreground leading-relaxed">
                        {event.description}
                      </p>
                    )}
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-6 text-center text-muted-foreground italic bg-muted/20">
                No upcoming events scheduled for {selectedCounty}.
              </Card>
            )}
          </div>

          {/* Local News */}
          <div>
            <h3 className="text-[20px] font-bold text-foreground mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                />
              </svg>
              Local Government News
            </h3>
            <p className="text-sm font-medium text-foreground mb-2">
              Choose news sources
            </p>
            <NewsSourceFilter
              value={selectedIds}
              onChange={setSelectedIds}
              className="mb-4"
            />
            {news.length > 0 ? (
              <NewsFeed
                articles={news.map((a) => ({
                  title: a.title,
                  summary: a.description,
                  source: { name: a.source },
                  url: a.url,
                  publishedAt: a.publishedAt,
                  urlToImage: a.urlToImage,
                }))}
              />
            ) : (
              <Card className="p-6 text-center text-muted-foreground italic bg-muted/20">
                No recent local news available for {selectedCounty}.
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CountySelector(props: CountySelectorProps) {
  return (
    <Suspense
      fallback={
        <Card className="p-8 text-center text-muted-foreground">
          Loading county tools…
        </Card>
      }
    >
      <CountySelectorInner {...props} />
    </Suspense>
  );
}
