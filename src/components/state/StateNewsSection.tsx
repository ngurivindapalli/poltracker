"use client";

import { Suspense, useState, useEffect } from "react";
import StateLocationSelector from "./StateLocationSelector";
import NewsFeed from "@/components/news/NewsFeed";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useNewsSourceSelection } from "@/hooks/useNewsSourceSelection";
import { NewsSourceFilter } from "@/components/news/NewsSourceFilter";
import {
  DEFAULT_NEWS_SOURCE_IDS,
  buildNewsApiSourcesQueryParam,
  filterArticlesBySourceIds,
} from "@/lib/newsSources";

interface Article {
  title: string;
  summary: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface StateNewsData {
  articles: Article[];
  summary: string;
  keywords: string[];
}

interface StateNewsSectionProps {
  stateCode: string;
  stateName: string;
}

function StateNewsSectionInner({
  stateCode,
  stateName,
}: StateNewsSectionProps) {
  const [data, setData] = useState<StateNewsData>({
    articles: [],
    summary: "",
    keywords: [],
  });
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string>("state");
  const [locationValue, setLocationValue] = useState<string | undefined>(
    undefined
  );
  const { selectedIds, setSelectedIds, ready } = useNewsSourceSelection();

  const effectiveIds =
    selectedIds.length > 0 ? selectedIds : DEFAULT_NEWS_SOURCE_IDS;

  useEffect(() => {
    if (!ready) return;

    async function fetchNews() {
      try {
        let url = `/api/state/${stateCode.toUpperCase()}/news?scope=${scope}`;
        if (locationValue) {
          url += `&value=${encodeURIComponent(locationValue)}`;
        }
        url += `&sources=${encodeURIComponent(
          buildNewsApiSourcesQueryParam(effectiveIds)
        )}`;

        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setData({ articles: [], summary: "", keywords: [] });
          setLoading(false);
          return;
        }

        const result = await res.json();
        const mapped = (result.articles || []).map((a: Article) => ({
          ...a,
          source: a.source,
        }));
        const articles = filterArticlesBySourceIds(
          mapped.map((a: Article) => ({
            ...a,
            source: { name: a.source },
          })),
          effectiveIds
        ).map((a: any) => ({
          ...a,
          source:
            typeof a.source === "object"
              ? a.source?.name ?? ""
              : String(a.source ?? ""),
        })) as Article[];

        setData({
          articles,
          summary: result.summary || "",
          keywords: result.keywords || [],
        });
      } catch {
        setData({ articles: [], summary: "", keywords: [] });
      } finally {
        setLoading(false);
      }
    }

    fetchNews();
  }, [stateCode, scope, locationValue, effectiveIds, ready, selectedIds]);

  function handleLocationChange(newScope: string, value?: string) {
    setScope(newScope);
    setLocationValue(value);
    setLoading(true);
  }

  function getLocationText(): string {
    if (scope === "state") {
      return `Showing statewide political news.`;
    } else if (scope === "county" && locationValue) {
      return `Showing political news for ${locationValue}, ${stateName}`;
    } else if (scope === "city" && locationValue) {
      return `Showing political news for ${locationValue}, ${stateName}`;
    }
    return `Showing statewide political news.`;
  }

  if (loading) {
    return (
      <section className="mb-12">
        <h2 className="text-[24px] font-semibold text-foreground mb-6">
          State Political News
        </h2>
        <Card className="p-8 text-center text-muted-foreground">
          Loading news...
        </Card>
      </section>
    );
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-[24px] font-semibold text-foreground">
          State Political News
        </h2>
        <Badge variant="neutral">
          {scope === "state" ? "Statewide" : locationValue}
        </Badge>
      </div>

      <p className="text-sm font-medium text-foreground mb-2">
        Choose news sources
      </p>
      <NewsSourceFilter
        value={selectedIds}
        onChange={setSelectedIds}
        className="mb-6"
      />

      <StateLocationSelector
        stateCode={stateCode}
        stateName={stateName}
        onLocationChange={handleLocationChange}
      />

      <p className="text-sm text-muted-foreground mb-6">{getLocationText()}</p>

      {data.summary && (
        <Card className="mb-8 bg-muted/30">
          <h3 className="text-[16px] font-semibold text-foreground mb-2">
            Analysis
          </h3>
          <p className="text-[15px] text-muted-foreground leading-relaxed">
            {data.summary}
          </p>
        </Card>
      )}

      {data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="text-sm font-medium text-muted-foreground mr-2 self-center">
            Top Issues:
          </span>
          {data.keywords.map((keyword, index) => (
            <Badge key={index} variant="default" className="text-[13px] px-3 py-1">
              {keyword}
            </Badge>
          ))}
        </div>
      )}

      {data.articles.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground italic">
          No verified {stateName}-specific political developments at this time.
        </Card>
      ) : (
        <NewsFeed
          articles={data.articles.map((a) => ({
            title: a.title,
            summary: a.summary,
            source: { name: a.source },
            url: a.url,
            publishedAt: a.publishedAt,
          }))}
        />
      )}
    </section>
  );
}

export default function StateNewsSection(props: StateNewsSectionProps) {
  return (
    <Suspense
      fallback={
        <section className="mb-12">
          <Card className="p-8 text-center text-muted-foreground">
            Loading state news…
          </Card>
        </section>
      }
    >
      <StateNewsSectionInner {...props} />
    </Suspense>
  );
}
