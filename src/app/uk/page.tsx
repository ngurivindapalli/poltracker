"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import NewsFeed from "@/components/news/NewsFeed";
import LeaderImage from "@/components/LeaderImage";

export default function UKPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);

      try {
        const res = await fetch(`/api/uk/news`);
        const data = await res.json();
        setNews(data.articles || []);
      } catch (err) {
        console.error("Error fetching UK news:", err);
        setNews([]);
      }

      setLoading(false);
    }

    load();
  }, []);

  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
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

      <PageHeader
        title="United Kingdom"
        subtitle="Track major UK political developments, Parliament news, and government updates."
      />

      {/* Prime Minister Section */}
      <Link href="/leader/starmer">
        <Card className="mb-12 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-shadow cursor-pointer">
          <LeaderImage
            src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Official_portrait_of_Keir_Starmer_crop_2.jpg"
            name="Keir Starmer"
            size="w-40 h-40"
          />
          <div className="text-center md:text-left">
            <h2 className="text-[28px] font-bold text-[#1E3A5F] mb-2">
              Keir Starmer
            </h2>
            <p className="text-[18px] text-[#64748B]">Prime Minister of the United Kingdom</p>
            <p className="text-[14px] text-[#94A3B8] mt-2">
              Labour Party
            </p>
          </div>
        </Card>
      </Link>

      {/* News Section */}
      <Section title="UK Political News" subtitle="Latest developments from Westminster and across the UK">
        {loading ? (
          <Card className="p-8 text-center text-[#64748B]">
            Loading UK news...
          </Card>
        ) : news.length > 0 ? (
          <NewsFeed articles={news} />
        ) : (
          <Card className="p-8 text-center text-[#64748B] italic bg-[#F8FAFC]">
            No recent UK political news available.
          </Card>
        )}
      </Section>
    </main>
  );
}
