"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

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

export default function RecentTrades({ bioguideId }: { bioguideId: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tradesSyncComplete, setTradesSyncComplete] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/member/${encodeURIComponent(bioguideId)}/financial-profile`
        );
        if (!res.ok) {
          throw new Error(`Failed to load trades (${res.status})`);
        }
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
      } catch (e) {
        if (!cancelled) {
          setTrades([]);
          setError((e as Error).message || "Failed to load trades");
        }
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
      <div className="flex items-end justify-between gap-4 mb-4">
        <h2 className="text-xl font-semibold text-[#1E3A5F]">
          Congressional Trading
        </h2>
      </div>
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-[#64748B]">Loading trades…</div>
        ) : error ? (
          <div className="p-6 text-sm text-amber-800">
            Could not load congressional trades: {error}
          </div>
        ) : trades.length === 0 ? (
          <div className="p-6 text-sm text-[#64748B] space-y-2">
            {tradesSyncComplete ? (
              <p>
                No congressional trades found in the synchronized Quiver
                dataset.
              </p>
            ) : (
              <p>
                Congressional trade data is not ready yet. The synchronized
                Quiver dataset has not completed a full history import.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left bg-[#F8FAFC]">
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Trade date
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Filed
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Ticker
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Transaction
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Amount range
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Chamber / Party
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {trades.map((t, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-[#1E3A5F]">
                      {t.tradeDate || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#64748B]">
                      {t.filingDate || "—"}
                    </td>
                    <td className="py-3 px-4">
                      {t.ticker ? (
                        <span className="font-semibold text-[#2563EB]">
                          {t.ticker}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#374151]">
                      {t.txType || t.buySell || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#374151]">
                      {t.amountLabel || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#64748B] text-xs">
                      {[t.chamber, t.party].filter(Boolean).join(" · ") || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-[#F1F5F9]">
          <QuiverSourceLabel lastUpdated={lastUpdated} />
        </div>
      </Card>
    </section>
  );
}
