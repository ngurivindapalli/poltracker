"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type TrumpTrade = {
  ticker: string | null;
  company: string | null;
  transaction: string | null;
  transactionDate: string | null;
  reportDate: string | null;
  amount: string | null;
};

type Stats = {
  total: number;
  purchases: number;
  sales: number;
  mostTraded: Array<{ ticker: string; count: number }>;
};

export default function TrumpTradesPanel({
  limit = 50,
  compact = false,
}: {
  limit?: number;
  compact?: boolean;
}) {
  const [trades, setTrades] = useState<TrumpTrade[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/trump-trades?limit=${limit}`);
        const json = await res.json();
        if (!cancelled) {
          setTrades(json.trades || []);
          setStats(json.stats || null);
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) {
          setTrades([]);
          setStats(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [limit]);

  const visible = showAll ? trades : trades.slice(0, compact ? 8 : 25);

  return (
    <Card className="overflow-hidden p-0">
      {stats && !compact ? (
        <div className="grid gap-4 border-b border-border p-6 sm:grid-cols-4">
          <div>
            <p className="label-caps">Reported trades</p>
            <p className="stat-num mt-1 text-2xl">{stats.total}</p>
          </div>
          <div>
            <p className="label-caps">Purchases</p>
            <p className="stat-num mt-1 text-2xl">{stats.purchases}</p>
          </div>
          <div>
            <p className="label-caps">Sales</p>
            <p className="stat-num mt-1 text-2xl">{stats.sales}</p>
          </div>
          <div>
            <p className="label-caps">Most traded</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {stats.mostTraded.length
                ? stats.mostTraded.map((t) => t.ticker).join(", ")
                : "—"}
            </p>
          </div>
        </div>
      ) : null}

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Loading…</div>
      ) : trades.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">
          No reported Trump stock trades in the synchronized cache.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Date
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Ticker
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Transaction
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Amount
                </th>
                <th className="px-4 py-3 text-xs font-semibold uppercase text-muted-foreground">
                  Filed
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {visible.map((t, i) => (
                <tr key={i} className="hover:bg-muted/30">
                  <td className="px-4 py-3">{t.transactionDate || "—"}</td>
                  <td className="px-4 py-3 font-medium">{t.ticker || "—"}</td>
                  <td className="px-4 py-3">{t.transaction || "—"}</td>
                  <td className="px-4 py-3">{t.amount || "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {t.reportDate || "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <QuiverSourceLabel lastUpdated={lastUpdated} />
        <div className="flex items-center gap-3">
          {trades.length > (compact ? 8 : 25) ? (
            <button
              type="button"
              className="text-sm font-medium hover:underline"
              onClick={() => setShowAll((v) => !v)}
            >
              {showAll ? "Show fewer" : "View all trades"}
            </button>
          ) : null}
          {compact ? (
            <Link href="/trump-trades" className="text-sm font-medium hover:underline">
              Full trading page
            </Link>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
