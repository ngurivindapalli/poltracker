"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Trade = {
  ticker: string | null;
  asset: string;
  assetType: string | null;
  txType: string;
  buySell: string | null;
  amountLabel?: string | null;
  amountLow?: number | null;
  amountHigh?: number | null;
  tradeDate: string | null;
  owner: string | null;
};

function formatAmount(t: Trade) {
  if (t.amountLabel) return t.amountLabel;
  if (t.amountLow != null && t.amountHigh != null) {
    return `$${t.amountLow.toLocaleString()} – $${t.amountHigh.toLocaleString()}`;
  }
  return "—";
}

export default function RecentTrades({ bioguideId }: { bioguideId: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${bioguideId}/trades?limit=15`);
        const json = await res.json();
        if (!cancelled) setTrades(json.trades || []);
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
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">Recent Trades</h2>
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <div className="p-6 text-sm text-[#64748B]">Loading trades…</div>
        ) : trades.length === 0 ? (
          <div className="p-6 text-sm text-[#64748B]">
            No recent congressional trades found for this member.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left bg-[#F8FAFC]">
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Date
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Ticker
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Side
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Amount
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Asset
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {trades.map((t, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-[#1E3A5F]">{t.tradeDate || "—"}</td>
                    <td className="py-3 px-4">
                      {t.ticker ? (
                        <span className="font-semibold text-[#2563EB]">{t.ticker}</span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#374151]">
                      {t.buySell || t.txType || "—"}
                    </td>
                    <td className="py-3 px-4 text-[#374151]">{formatAmount(t)}</td>
                    <td className="py-3 px-4 text-[#64748B] max-w-[220px] truncate">
                      {t.asset}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  );
}
