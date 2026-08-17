"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type TickerRow = {
  ticker: string;
  tradeCount: number;
  lastTradeDate: string | null;
};

export default function LargestHoldings({ bioguideId }: { bioguideId: string }) {
  const [rows, setRows] = useState<TickerRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

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
          setRows(
            Array.isArray(json.mostTradedTickers) ? json.mostTradedTickers : []
          );
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Most traded tickers</h2>
      <Card className="p-6">
        <p className="mb-4 text-sm text-muted-foreground">
          Tickers with the most disclosed congressional trades for this member.
          This is activity, not a holdings list.
        </p>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No disclosed trades in the synchronized dataset.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li
                key={r.ticker}
                className="flex items-center justify-between py-2.5 text-sm"
              >
                <span className="font-medium">{r.ticker}</span>
                <span className="text-muted-foreground">
                  {r.tradeCount} trades
                  {r.lastTradeDate ? ` · last ${r.lastTradeDate}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <QuiverSourceLabel lastUpdated={lastUpdated} />
        </div>
      </Card>
    </section>
  );
}
