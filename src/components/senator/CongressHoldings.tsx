"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type Position = { ticker: string; value: number };

type HoldingsPayload = {
  politicianName: string;
  positions: Position[];
  lastUpdated: string | null;
};

function formatValue(n: number) {
  const abs = Math.abs(n);
  const sign = n < 0 ? "−" : "";
  if (abs >= 1_000_000) return `${sign}$${(abs / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${sign}$${(abs / 1_000).toFixed(0)}K`;
  return `${sign}$${abs.toLocaleString()}`;
}

export default function CongressHoldings({
  bioguideId,
}: {
  bioguideId: string;
}) {
  const [data, setData] = useState<HoldingsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/member/${encodeURIComponent(bioguideId)}/financial-profile`
        );
        const json = await res.json();
        if (!cancelled) {
          setData(json.congressHoldings ?? null);
        }
      } catch {
        if (!cancelled) setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  const positions = data?.positions ?? [];
  const visible = showAll ? positions : positions.slice(0, 12);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Estimated stock holdings</h2>
      <Card className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Estimated ticker values from Quiver Quantitative. This is not an
          official financial disclosure and may not reflect current positions.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading holdings…</p>
        ) : positions.length === 0 ? (
          <EmptyState
            title="No holdings snapshot for this member"
            description="Quiver may not publish a holdings row for every politician, or the cache may need a sync."
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="py-2 pr-4 text-xs font-semibold uppercase text-muted-foreground">
                      Ticker
                    </th>
                    <th className="py-2 text-xs font-semibold uppercase text-muted-foreground">
                      Estimated value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {visible.map((p) => (
                    <tr key={p.ticker}>
                      <td className="py-2.5 pr-4 font-medium">{p.ticker}</td>
                      <td className="py-2.5 tabular-nums text-muted-foreground">
                        {formatValue(p.value)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {positions.length > 12 ? (
              <button
                type="button"
                className="mt-4 text-sm font-medium text-foreground hover:underline"
                onClick={() => setShowAll((v) => !v)}
              >
                {showAll ? "Show fewer" : `View all ${positions.length} holdings`}
              </button>
            ) : null}
          </>
        )}
        <div className="mt-4">
          <QuiverSourceLabel lastUpdated={data?.lastUpdated} estimateDisclaimer />
        </div>
      </Card>
    </section>
  );
}
