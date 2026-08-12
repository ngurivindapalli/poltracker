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
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
        Financial Overview
      </h2>
      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[#64748B]">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-4">
              <div>
                <div className="text-[12px] uppercase tracking-wide text-[#64748B] font-semibold">
                  Estimated Net Worth
                </div>
                <div className="text-2xl font-bold text-green-700 mt-1">
                  {money(data?.estimatedNetWorth ?? null)}
                </div>
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wide text-[#64748B] font-semibold">
                  Trade Count
                </div>
                <div className="text-2xl font-bold text-[#1E3A5F] mt-1">
                  {data?.tradeCount ?? "—"}
                </div>
              </div>
              <div>
                <div className="text-[12px] uppercase tracking-wide text-[#64748B] font-semibold">
                  Trade Volume
                </div>
                <div className="text-2xl font-bold text-[#1E3A5F] mt-1">
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
