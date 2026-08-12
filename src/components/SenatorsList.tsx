"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { SenatorSummaryRow } from "@/lib/senators/types";

function money(n: number | null | undefined) {
  if (n == null || Number.isNaN(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) {
    return `$${(n / 1_000_000_000).toFixed(1)}B`;
  }
  if (abs >= 1_000_000) {
    return `$${(n / 1_000_000).toFixed(1)}M`;
  }
  if (abs >= 10_000) {
    return `$${Math.round(n / 1000)}K`;
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function partyLabel(party?: string | null) {
  if (!party) return "—";
  const p = party.toLowerCase();
  if (p.startsWith("d") || p.includes("democrat")) return "Democrat";
  if (p.startsWith("r") || p.includes("republican")) return "Republican";
  if (p.startsWith("i") || p.includes("independ")) return "Independent";
  return party;
}

function stateLine(state?: string | null, party?: string | null) {
  const bits = [state, partyLabel(party)].filter(Boolean);
  return bits.join(" · ") || "—";
}

interface SenatorsListProps {
  senators: SenatorSummaryRow[];
  limit?: number;
}

export default function SenatorsList({
  senators = [],
  limit,
}: SenatorsListProps) {
  const displaySenators = limit ? senators.slice(0, limit) : senators;

  if (displaySenators.length === 0) {
    return (
      <div className="text-[#64748B] p-8 text-center bg-white rounded-lg border border-[#E2E8F0]">
        No senators found. Run a background Quiver sync to rebuild summaries.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displaySenators.map((senator) => {
        const isDemocrat = senator.party?.toLowerCase().includes("democrat") ||
          senator.party?.toLowerCase() === "d" ||
          senator.party?.toLowerCase() === "democratic";
        const isRepublican =
          senator.party?.toLowerCase().includes("republican") ||
          senator.party?.toLowerCase() === "r";

        return (
          <Link
            key={senator.bioguideId}
            href={`/senator/${senator.bioguideId}`}
            className="block h-full group"
          >
            <Card className="h-full flex flex-col p-0 overflow-hidden transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="relative w-full aspect-[4/5] bg-[#F1F5F9]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    senator.imageUrl ||
                    `https://unitedstates.github.io/images/congress/225x275/${senator.bioguideId}.jpg`
                  }
                  alt={senator.name}
                  className="w-full h-full object-cover object-top"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.src = "/images/placeholder-avatar.svg";
                  }}
                />
              </div>

              <div className="flex flex-col flex-1 p-5 text-left">
                <h3 className="text-[17px] font-semibold text-[#1E3A5F] mb-1 group-hover:text-[#2563EB] transition-colors leading-snug">
                  {senator.name}
                </h3>
                <p className="text-sm text-[#64748B] mb-3">
                  {stateLine(senator.state, senator.party)}
                </p>

                <div className="mt-auto pt-3 border-t border-[#F1F5F9]">
                  <div className="text-[11px] uppercase tracking-wide font-semibold text-[#94A3B8]">
                    Estimated Net Worth
                  </div>
                  <div className="text-xl font-bold text-green-700 mt-0.5">
                    {money(senator.estimatedNetWorth)}
                  </div>
                  {(senator.tradeCount ?? 0) > 0 && (
                    <div className="text-xs text-[#94A3B8] mt-1">
                      {senator.tradeCount} disclosed trade
                      {senator.tradeCount === 1 ? "" : "s"}
                    </div>
                  )}
                </div>

                <div className="mt-3">
                  <Badge
                    variant={
                      isDemocrat
                        ? "default"
                        : isRepublican
                          ? "danger"
                          : "neutral"
                    }
                  >
                    {partyLabel(senator.party)}
                  </Badge>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
