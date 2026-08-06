"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type HistoryPoint = {
  date: string;
  tradeCount?: number;
  amount?: number | null;
  agency?: string | null;
  ticker?: string;
};

export default function PortfolioContractHistory({
  bioguideId,
}: {
  bioguideId: string;
}) {
  const [portfolio, setPortfolio] = useState<HistoryPoint[]>([]);
  const [contracts, setContracts] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${bioguideId}/financial-profile`);
        const json = await res.json();
        if (!cancelled) {
          setPortfolio(json.portfolioHistory || []);
          setContracts(json.contractHistory || []);
        }
      } catch {
        if (!cancelled) {
          setPortfolio([]);
          setContracts([]);
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <section>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">Portfolio History</h2>
        <Card className="p-6">
          {loading ? (
            <div className="text-sm text-[#64748B]">Loading…</div>
          ) : portfolio.length === 0 ? (
            <div className="text-sm text-[#64748B]">No portfolio history yet.</div>
          ) : (
            <SimpleBars
              points={portfolio.map((p) => ({
                label: (p.date || "").slice(0, 7),
                value: p.tradeCount || 0,
              }))}
              unit="trades"
            />
          )}
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">Contract History</h2>
        <Card className="p-6">
          {loading ? (
            <div className="text-sm text-[#64748B]">Loading…</div>
          ) : contracts.length === 0 ? (
            <div className="text-sm text-[#64748B]">No contract history yet.</div>
          ) : (
            <ul className="space-y-2 max-h-64 overflow-y-auto">
              {contracts.slice(0, 24).map((c, i) => (
                <li
                  key={i}
                  className="flex justify-between gap-3 text-sm border-b border-[#F1F5F9] pb-2"
                >
                  <div>
                    <span className="font-medium text-[#2563EB]">{c.ticker}</span>
                    <span className="text-[#94A3B8] ml-2">{c.date || "—"}</span>
                    {c.agency && (
                      <div className="text-[12px] text-[#64748B] truncate max-w-[200px]">
                        {c.agency}
                      </div>
                    )}
                  </div>
                  <span className="text-[#111827] whitespace-nowrap">
                    {c.amount != null
                      ? `$${Number(c.amount).toLocaleString()}`
                      : "—"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </section>
    </div>
  );
}

function SimpleBars({
  points,
  unit,
}: {
  points: { label: string; value: number }[];
  unit: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const shown = points.slice(-18);
  return (
    <div>
      <div className="flex items-end gap-1 h-32">
        {shown.map((p, i) => (
          <div key={i} className="flex-1 flex flex-col items-center justify-end h-full">
            <div
              className="w-full bg-[#2563EB]/80 rounded-t min-h-[2px]"
              style={{ height: `${(p.value / max) * 100}%` }}
              title={`${p.label}: ${p.value} ${unit}`}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 text-[11px] text-[#94A3B8] text-center">
        Monthly trade volume (last {shown.length} months)
      </div>
    </div>
  );
}
