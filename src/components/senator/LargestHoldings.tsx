"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

/**
 * Disclosed Holdings + Estimated Live Portfolio are Quiver web product concepts.
 * Hobbyist API does not expose those position series. We show an explicit unavailable
 * state rather than inventing holdings from congressional trades.
 */
export default function LargestHoldings({ bioguideId }: { bioguideId: string }) {
  const [tradeCount, setTradeCount] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${encodeURIComponent(bioguideId)}/financial-profile`);
        const json = await res.json();
        if (!cancelled) {
          setTradeCount(
            json.financialOverview?.tradeCount ??
              json.portfolioSnapshot?.tradeCount ??
              (Array.isArray(json.recentTrades) ? json.recentTrades.length : null)
          );
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) setTradeCount(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Estimated Live Stock Portfolio
        </h2>
        <Card className="p-6">
          {loading ? (
            <div className="text-sm text-[#64748B]">Loading…</div>
          ) : (
            <>
              <p className="text-sm text-[#64748B] leading-relaxed">
                Quiver Quantitative publishes an estimated live stock portfolio on
                their website. The Hobbyist API plan used by Politeia does{" "}
                <span className="font-medium text-[#475569]">not</span> expose
                position-level portfolio holdings, so Politeia does not invent
                holdings from trade activity.
              </p>
              <p className="text-sm text-[#64748B] mt-3">
                Use <span className="font-medium">Estimated Net Worth</span> (from{" "}
                <code className="text-xs">/bulk/congress/politicians</code>) and{" "}
                <span className="font-medium">Congressional Trading</span> for
                available Quiver data
                {tradeCount != null ? ` (${tradeCount} trades reported).` : "."}
              </p>
              <div className="mt-4">
                <QuiverSourceLabel lastUpdated={lastUpdated} />
              </div>
            </>
          )}
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Disclosed Holdings
        </h2>
        <Card className="p-6">
          <p className="text-sm text-[#64748B] leading-relaxed">
            Disclosed holdings come from annual financial disclosure filings.
            That holdings line-item dataset is not available through the Quiver
            Hobbyist endpoints currently wired into Politeia. Politeia will not
            derive fake holding amounts from buy/sell ranges.
          </p>
          <div className="mt-4">
            <QuiverSourceLabel lastUpdated={lastUpdated} />
          </div>
        </Card>
      </div>
    </section>
  );
}
