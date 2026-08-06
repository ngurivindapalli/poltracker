"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Holding = {
  ticker: string;
  tradeCount: number;
  lastTradeDate: string | null;
};

export default function LargestHoldings({ bioguideId }: { bioguideId: string }) {
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${bioguideId}/financial-profile`);
        const json = await res.json();
        if (!cancelled) setHoldings(json.largestHoldings || []);
      } catch {
        if (!cancelled) setHoldings([]);
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
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">Largest Holdings</h2>
      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[#64748B]">Loading holdings…</div>
        ) : holdings.length === 0 ? (
          <div className="text-sm text-[#64748B]">
            No disclosed holdings derived from trading activity yet.
          </div>
        ) : (
          <div className="space-y-3">
            {holdings.map((h) => (
              <div
                key={h.ticker}
                className="flex items-center justify-between border-b border-[#F1F5F9] pb-2 last:border-0"
              >
                <div>
                  <span className="font-semibold text-[#2563EB]">{h.ticker}</span>
                  {h.lastTradeDate && (
                    <span className="ml-2 text-[12px] text-[#94A3B8]">
                      last {h.lastTradeDate}
                    </span>
                  )}
                </div>
                <span className="text-sm text-[#64748B]">
                  {h.tradeCount} {h.tradeCount === 1 ? "trade" : "trades"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
