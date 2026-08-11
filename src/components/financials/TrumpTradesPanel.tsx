"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type TrumpTrade = {
  ticker: string | null;
  company: string | null;
  transaction: string | null;
  transactionDate: string | null;
  reportDate: string | null;
  amount: string | null;
  excessReturn: number | null;
};

export default function TrumpTradesPanel({ limit = 50 }: { limit?: number }) {
  const [trades, setTrades] = useState<TrumpTrade[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/trump-trades?limit=${limit}`);
        const json = await res.json();
        if (!cancelled) {
          setTrades(json.trades || []);
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
  }, [limit]);

  return (
    <Card className="p-0 overflow-hidden">
      {loading ? (
        <div className="p-6 text-sm text-[#64748B]">Loading…</div>
      ) : trades.length === 0 ? (
        <div className="p-6 text-sm text-[#64748B]">
          No Trump stock trades in cache. Run{" "}
          <code className="text-xs">npm run sync:quiver:trump</code>.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E2E8F0] bg-[#F8FAFC] text-left">
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
                  Company
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                  Transaction
                </th>
                <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                  Amount range
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {trades.map((t, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC]">
                  <td className="py-3 px-4">{t.transactionDate || "—"}</td>
                  <td className="py-3 px-4 text-[#64748B]">
                    {t.reportDate || "—"}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[#2563EB]">
                    {t.ticker || "—"}
                  </td>
                  <td className="py-3 px-4 max-w-[220px] truncate">
                    {t.company || "—"}
                  </td>
                  <td className="py-3 px-4">{t.transaction || "—"}</td>
                  <td className="py-3 px-4">{t.amount || "—"}</td>
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
  );
}
