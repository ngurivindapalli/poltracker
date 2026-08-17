"use client";

import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { cn } from "@/lib/cn";

type Trade = {
  ticker: string | null;
  asset: string;
  assetType: string | null;
  txType: string;
  buySell: string | null;
  amountLabel?: string | null;
  tradeDate: string | null;
  filingDate?: string | null;
  owner: string | null;
  party?: string | null;
  chamber?: string | null;
};

function sideLabel(t: Trade) {
  const raw = `${t.buySell || ""} ${t.txType || ""}`.toLowerCase();
  if (raw.includes("buy") || raw.includes("purchase")) return "BUY";
  if (raw.includes("sell") || raw.includes("sale")) return "SELL";
  if (raw.includes("exchange")) return "EXCHANGE";
  return (t.txType || t.buySell || "—").toUpperCase();
}

export default function RecentTrades({ bioguideId }: { bioguideId: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradesSyncComplete, setTradesSyncComplete] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/member/${encodeURIComponent(bioguideId)}/financial-profile`
        );
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = await res.json();
        if (!cancelled) {
          setTrades(Array.isArray(json.recentTrades) ? json.recentTrades : []);
          setLastUpdated(json.lastUpdated || null);
          setTradesSyncComplete(
            Boolean(
              json.tradesSyncComplete ??
                json.financialOverview?.tradesSyncComplete
            )
          );
        }
      } catch {
        if (!cancelled) {
          setTrades([]);
          setError("unavailable");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  const filtered = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return trades;
    return trades.filter(
      (t) =>
        (t.ticker || "").toLowerCase().includes(n) ||
        (t.asset || "").toLowerCase().includes(n) ||
        (t.txType || "").toLowerCase().includes(n)
    );
  }, [trades, q]);

  return (
    <section>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="text-xl font-semibold">Congressional trading</h2>
        {trades.length > 0 ? (
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Filter ticker or asset"
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm sm:w-56"
          />
        ) : null}
      </div>
      <Card className="overflow-hidden p-0">
        {loading ? (
          <div className="p-6">
            <SkeletonTable rows={6} />
          </div>
        ) : error ? (
          <ErrorState
            title="Financial data is temporarily unavailable."
            description="Congressional trades could not be loaded from the synchronized dataset."
          />
        ) : trades.length === 0 ? (
          <EmptyState
            title={
              tradesSyncComplete
                ? "No recent financial disclosures"
                : "Trade history is still syncing"
            }
            description={
              tradesSyncComplete
                ? "This profile currently has no congressional trades in the synchronized Quiver dataset."
                : "The synchronized Quiver dataset has not completed a full history import."
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left">
                  {["Date", "Asset", "Transaction", "Amount range", "Filed"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((t, i) => {
                  const side = sideLabel(t);
                  return (
                    <tr key={i} className="hover:bg-muted/40">
                      <td className="whitespace-nowrap px-4 py-3 tabular-nums">
                        {t.tradeDate || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">{t.ticker || t.asset || "—"}</div>
                        {t.ticker && t.asset ? (
                          <div className="text-xs text-muted-foreground">
                            {t.asset}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            side === "BUY" && "bg-success/10 text-success",
                            side === "SELL" && "bg-destructive/10 text-destructive",
                            side !== "BUY" &&
                              side !== "SELL" &&
                              "bg-muted text-muted-foreground"
                          )}
                        >
                          {side}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.amountLabel || "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {t.filingDate || "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <div className="border-t border-border px-4 py-3">
          <QuiverSourceLabel lastUpdated={lastUpdated} />
        </div>
      </Card>
    </section>
  );
}
