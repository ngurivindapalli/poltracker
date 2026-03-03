"use client";

import { useEffect, useMemo, useState } from "react";

type Trade = {
  senator: string;
  office?: string;
  reportTitle?: string;
  reportDate?: string;
  reportUrl?: string;
  transactionDate?: string; // ISO YYYY-MM-DD
  owner?: string;
  ticker?: string | null;
  asset?: string | null;
  assetType?: string | null;
  rawOwner?: string | null;
};

function monthKey(iso?: string) {
  if (!iso || iso.length < 7) return null;
  return iso.slice(0, 7); // YYYY-MM
}

export default function InvestmentHistorySection({ senatorName }: { senatorName: string }) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [tickerFilter, setTickerFilter] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function run() {
      setLoading(true);
      try {
        const res = await fetch(`/api/investments/${encodeURIComponent(senatorName)}`);
        const json = await res.json();
        const t = (json?.trades ?? []) as Trade[];
        if (!cancelled) setTrades(t);
      } catch {
        if (!cancelled) setTrades([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [senatorName]);

  const filtered = useMemo(() => {
    const q = tickerFilter.trim().toUpperCase();
    if (!q) return trades;
    return trades.filter(t => (t.ticker || "").toUpperCase().includes(q));
  }, [trades, tickerFilter]);

  const summary = useMemo(() => {
    const total = trades.length;
    const tickers = new Set(trades.map(t => (t.ticker || "").toUpperCase()).filter(Boolean));
    const owners = new Set(trades.map(t => t.owner || "").filter(Boolean));
    return { total, uniqueTickers: tickers.size, owners: owners.size };
  }, [trades]);

  const activity = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of trades) {
      const k = monthKey(t.transactionDate);
      if (!k) continue;
      counts[k] = (counts[k] || 0) + 1;
    }
    return Object.keys(counts)
      .sort()
      .map(k => ({ date: k + "-01", trades: counts[k] }));
  }, [trades]);

  return (
    <div className="space-y-10">
      {/* Trading Activity */}
      <section>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Trading Activity
        </h2>
        <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6">
          {loading ? (
            <div className="text-sm text-[#64748B] text-center py-8">Loading…</div>
          ) : activity.length < 2 ? (
            <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-6 text-center text-sm text-[#64748B]">
              Not enough trading history to display a chart.
            </div>
          ) : (
            <SimpleLineChart data={activity} />
          )}
        </div>
      </section>

      {/* Investment History */}
      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-[#1E3A5F]">
            Investment History
          </h2>

          {trades.length > 0 && (
            <input
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value)}
              placeholder="Filter by ticker (e.g., YUM)"
              className="w-64 rounded-lg border border-[#E2E8F0] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          )}
        </div>

        {!loading && trades.length === 0 ? (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-8 text-center">
            <div className="text-sm text-[#64748B]">
              No STOCK Act PTR trades found for this senator in the last 4 years.
            </div>
          </div>
        ) : (
          <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6">
            <div className="mb-6 grid grid-cols-3 gap-4">
              <Stat label="Total trades" value={summary.total} />
              <Stat label="Unique tickers" value={summary.uniqueTickers} />
              <Stat label="Owners seen" value={summary.owners} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#E2E8F0] text-left">
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Date</th>
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Ticker</th>
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Asset</th>
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Owner</th>
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Type</th>
                    <th className="py-3 pr-4 text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">Report</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E8F0]">
                  {filtered.slice(0, 200).map((t, idx) => (
                    <tr key={idx} className="hover:bg-[#F8FAFC] transition-colors">
                      <td className="py-3 pr-4 text-[#1E3A5F]">{t.transactionDate || "—"}</td>
                      <td className="py-3 pr-4">
                        {t.ticker ? (
                          <span className="inline-flex px-2 py-0.5 rounded text-[13px] font-semibold bg-[#2563EB]/10 text-[#2563EB]">
                            {t.ticker}
                          </span>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-[#374151] max-w-[200px] truncate">{t.asset || "—"}</td>
                      <td className="py-3 pr-4 text-[#64748B]">{t.owner || "—"}</td>
                      <td className="py-3 pr-4">
                        <span className="inline-flex px-2 py-0.5 rounded text-[12px] font-medium bg-[#F1F5F9] text-[#64748B]">
                          {t.assetType || "—"}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {t.reportUrl ? (
                          <a className="text-[13px] text-[#2563EB] hover:underline" href={t.reportUrl} target="_blank" rel="noopener noreferrer">
                            View →
                          </a>
                        ) : (
                          <span className="text-[#94A3B8]">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length > 200 && (
                <div className="mt-4 text-center text-[13px] text-[#64748B]">
                  Showing first 200 of {filtered.length} trades.
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] p-4 text-center">
      <div className="text-[12px] font-medium text-[#64748B] uppercase tracking-wide">{label}</div>
      <div className="mt-2 text-[24px] font-bold text-[#1E3A5F]">{value}</div>
    </div>
  );
}

/**
 * Minimal chart without adding new dependencies.
 * If you already use recharts, replace this with your existing chart component.
 */
function SimpleLineChart({ data }: { data: { date: string; trades: number }[] }) {
  // Lightweight SVG chart
  const w = 800, h = 220, pad = 30;
  const max = Math.max(...data.map(d => d.trades), 1);
  const xs = data.map((_, i) => pad + (i * (w - pad * 2)) / Math.max(data.length - 1, 1));
  const ys = data.map(d => h - pad - (d.trades * (h - pad * 2)) / max);

  const path = xs.map((x, i) => `${i === 0 ? "M" : "L"} ${x} ${ys[i]}`).join(" ");

  return (
    <div className="w-full overflow-x-auto">
      <svg width={Math.max(w, data.length * 30)} height={h} className="w-full">
        <path d={path} fill="none" stroke="#2563EB" strokeWidth="2" />
      </svg>
      <div className="mt-2 text-xs text-[#64748B] text-center">
        Trades per month (last 4 years)
      </div>
    </div>
  );
}
