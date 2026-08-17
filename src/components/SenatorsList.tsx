"use client";

import Link from "next/link";
import type { SenatorSummaryRow } from "@/lib/senators/types";
import { formatUsdCompact } from "@/lib/format";
import { PartyBadge } from "@/components/politics/PartyBadge";
import { EmptyState } from "@/components/ui/EmptyState";

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
      <EmptyState
        title="No senators found"
        description="This directory is built from the last successful data sync. If this is empty, the senator summary warehouse has not been generated yet."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {displaySenators.map((senator) => (
        <Link
          key={senator.bioguideId}
          href={`/senator/${senator.bioguideId}`}
          className="interactive-card group block h-full overflow-hidden"
        >
          <div className="relative aspect-[4/5] bg-muted">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={
                senator.imageUrl ||
                `https://unitedstates.github.io/images/congress/225x275/${senator.bioguideId}.jpg`
              }
              alt=""
              className="h-full w-full object-cover object-top"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.src = "/images/placeholder-avatar.svg";
              }}
            />
          </div>
          <div className="flex flex-1 flex-col p-4">
            <h3 className="text-[15px] font-semibold leading-snug text-foreground group-hover:underline">
              {senator.name}
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              U.S. Senator · {senator.state || "—"}
            </p>
            <div className="mt-3">
              <PartyBadge party={senator.party} />
            </div>
            <div className="mt-4 border-t border-border pt-3">
              <div className="label-caps">Estimated net worth</div>
              <div className="stat-num mt-0.5 text-lg">
                {formatUsdCompact(senator.estimatedNetWorth)}
              </div>
              {(senator.tradeCount ?? 0) > 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  {senator.tradeCount === 1
                    ? "1 disclosed trade"
                    : `${senator.tradeCount} disclosed trades`}
                </p>
              ) : null}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
