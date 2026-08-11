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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/member/${bioguideId}/financial-profile`
        );
        const json = await res.json();
        if (!cancelled) {
          setTrades(json.recentTrades || []);
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) setTrades([]);
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
        ) : trades.length === 0 ? (
          <div className="p-6 text-sm text-[#64748B]">
            No Quiver congressional trades found for this member. Run{" "}
            <code className="text-xs">npm run sync:quiver:trades</code> to
            refresh.
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
                    Buy/Sell
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
                    <td className="py-3 px-4 capitalize text-[#374151]">
                      {t.buySell || t.txType || "—"}
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
