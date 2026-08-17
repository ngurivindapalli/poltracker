"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type Overview = {
  estimatedNetWorth: number | null;
  tradeCount: number | null;
  tradeVolume: number | null;
  lastUpdated: string | null;
};

function money(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function FinancialOverview({
  bioguideId,
  initialData,
}: {
  bioguideId: string;
  /** Server-provided summary — avoids a client fetch when present. */
  initialData?: Overview | null;
}) {
  const [data, setData] = useState<Overview | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    if (initialData) {
      setData(initialData);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/member/${bioguideId}/financial-profile`);
        const json = await res.json();
        if (!cancelled) {
          setData({
            estimatedNetWorth:
              json.financialOverview?.estimatedNetWorth ??
              json.estimatedNetWorth,
            tradeCount: json.financialOverview?.tradeCount ?? null,
            tradeVolume: json.financialOverview?.tradeVolume ?? null,
            lastUpdated: json.lastUpdated ?? null,
          });
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
  }, [bioguideId, initialData]);

  return (
    <section>
      <h2 className="mb-4 text-xl font-semibold">Financial overview</h2>
      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading overview…</div>
        ) : (
          <>
            <div className="mb-4 grid grid-cols-1 gap-6 sm:grid-cols-3">
              <div>
                <div className="label-caps">Estimated net worth</div>
                <div className="stat-num mt-1 text-2xl">
                  {money(data?.estimatedNetWorth ?? null)}
                </div>
              </div>
              <div>
                <div className="label-caps">Trade count</div>
                <div className="stat-num mt-1 text-2xl">
                  {data?.tradeCount ?? "—"}
                </div>
              </div>
              <div>
                <div className="label-caps">Trade volume</div>
                <div className="stat-num mt-1 text-2xl">
                  {money(data?.tradeVolume ?? null)}
                </div>
              </div>
            </div>
            <QuiverSourceLabel
              lastUpdated={data?.lastUpdated}
              estimateDisclaimer
            />
          </>
        )}
      </Card>
    </section>
  );
}
