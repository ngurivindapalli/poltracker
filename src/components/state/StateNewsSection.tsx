"use client";

import { useState, useEffect } from "react";
import StateLocationSelector from "./StateLocationSelector";
import NewsFeed from "@/components/news/NewsFeed";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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

export default function StateNewsSection({ stateCode, stateName }: StateNewsSectionProps) {
  const [data, setData] = useState<StateNewsData>({ articles: [], summary: "", keywords: [] });
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState<string>("state");
  const [locationValue, setLocationValue] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function fetchNews() {
      try {
        let url = `/api/state/${stateCode.toUpperCase()}/news?scope=${scope}`;
        if (locationValue) {
          url += `&value=${encodeURIComponent(locationValue)}`;
        }
        
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          setData({ articles: [], summary: "", keywords: [] });
          setLoading(false);
          return;
        }
        
        const result = await res.json();
        setData({
          articles: result.articles || [],
          summary: result.summary || "",
          keywords: result.keywords || []
        });
      } catch (err) {
        setData({ articles: [], summary: "", keywords: [] });
      } finally {
        setLoading(false);
      }
    }
    
    fetchNews();
  }, [stateCode, scope, locationValue]);
  
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
            <h2 className="text-[24px] font-semibold text-[#1E3A5F] mb-6">State Political News</h2>
             <Card className="p-8 text-center text-[#64748B]">
                Loading news...
            </Card>
        </section>
     )
  }

  return (
    <section className="mb-12">
      <div className="flex items-center justify-between mb-6">
         <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
            State Political News
         </h2>
         <Badge variant="neutral">{scope === "state" ? "Statewide" : locationValue}</Badge>
      </div>
      
      <StateLocationSelector
        stateCode={stateCode}
        stateName={stateName}
        onLocationChange={handleLocationChange}
      />
      
      {data.summary && (
        <Card className="mb-8 bg-[#F8FAFC]">
          <h3 className="text-[16px] font-semibold text-[#1E3A5F] mb-2">Analysis</h3>
          <p className="text-[15px] text-[#334155] leading-relaxed">
            {data.summary}
          </p>
        </Card>
      )}
      
      {data.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
            <span className="text-sm font-medium text-[#64748B] mr-2 self-center">Top Issues:</span>
          {data.keywords.map((keyword, index) => (
            <Badge key={index} variant="default" className="text-[13px] px-3 py-1">
              {keyword}
            </Badge>
          ))}
        </div>
      )}

      {data.articles.length === 0 ? (
         <Card className="p-8 text-center text-[#64748B] italic">
            No verified {stateName}-specific political developments at this time.
         </Card>
      ) : (
          <NewsFeed articles={data.articles} />
      )}
    </section>
  );
}
