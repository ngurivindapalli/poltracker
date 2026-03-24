"use client";

import GermanyMap from "@/components/maps/GermanyMap";
import Link from "next/link";
import { germanStates } from "@/lib/germany/states";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import LeaderImage from "@/components/LeaderImage";

export default function Germany() {
  const states = germanStates.map((name) => ({
    name,
    slug: name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/ä/g, "ae")
      .replace(/ö/g, "oe")
      .replace(/ü/g, "ue")
      .replace(/ß/g, "ss"),
  }));

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
        title="Germany"
        subtitle="Federal Republic of Germany — Political landscape and state-level governance"
      />

      {/* Chancellor Section */}
      <Link href="/global/olaf-scholz">
        <Card className="mb-12 p-8 flex flex-col md:flex-row items-center gap-8 hover:shadow-lg transition-shadow cursor-pointer">
          <LeaderImage
            src="https://upload.wikimedia.org/wikipedia/commons/b/bc/Olaf_Scholz_in_2023.jpg"
            name="Olaf Scholz"
            size="w-40 h-40"
          />
          <div className="text-center md:text-left">
            <h2 className="text-[28px] font-bold text-[#1E3A5F] mb-2">
              Olaf Scholz
            </h2>
            <p className="text-[18px] text-[#64748B]">Chancellor of Germany</p>
            <p className="text-[14px] text-[#94A3B8] mt-2">
              Social Democratic Party (SPD)
            </p>
          </div>
        </Card>
      </Link>

      {/* Map Section */}
      <Section
        title="Explore By State"
        subtitle="Click on any state to view regional political information."
      >
        <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-4 overflow-hidden shadow-sm">
          <GermanyMap />
        </div>
      </Section>

      {/* States Grid */}
      <Section title="Federal States" subtitle="16 states of the Federal Republic">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {states.map((s) => (
            <Link
              key={s.slug}
              href={`/germany/state/${s.slug}`}
              className="px-4 py-3 bg-white border border-[#E2E8F0] rounded-[8px] text-[14px] font-medium text-[#1E3A5F] hover:bg-[#F8FAFC] hover:border-[#2563EB] hover:text-[#2563EB] transition-all text-center"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </Section>
    </main>
  );
}
