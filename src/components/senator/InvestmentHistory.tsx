"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { toSlug } from "@/lib/slug";

interface Trade {
  senator: string;
  office?: string;
  reportTitle?: string;
  reportDate?: string;
  reportUrl?: string;
  transactionDate?: string;
  owner?: string;
  ticker?: string;
  asset?: string;
  assetType?: string;
}

interface Summary {
  senator: string;
  slug: string;
  totalTrades: number;
  uniqueTickers: number;
  startDate?: string;
  endDate?: string;
  topTickers: { ticker: string; count: number }[];
  assetTypes: Record<string, number>;
  tradesByYear: Record<string, number>;
}

interface InvestmentHistoryProps {
  senatorName: string;
}

export default function InvestmentHistory({ senatorName }: InvestmentHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [tickerFilter, setTickerFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  useEffect(() => {
    const slug = toSlug(senatorName);
    
    fetch(`/api/portfolio/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setTrades(data.trades || []);
        setSummary(data.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [senatorName]);

  // Get unique years for filter
  const years = useMemo(() => {
    const yearSet = new Set<string>();
    trades.forEach((t) => {
      if (t.transactionDate) {
        const year = t.transactionDate.slice(0, 4);
        if (year.match(/^\d{4}$/)) {
          yearSet.add(year);
        }
      }
    });
    return Array.from(yearSet).sort().reverse();
  }, [trades]);

  // Get unique asset types for filter
  const assetTypes = useMemo(() => {
    const types = new Set<string>();
    trades.forEach((t) => {
      if (t.assetType) types.add(t.assetType);
    });
    return Array.from(types).sort();
  }, [trades]);

  // Filter trades
  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // Year filter
      if (yearFilter !== "all" && t.transactionDate) {
        if (!t.transactionDate.startsWith(yearFilter)) return false;
      }

      // Ticker filter
      if (tickerFilter) {
        const search = tickerFilter.toLowerCase();
        const matchesTicker = t.ticker?.toLowerCase().includes(search);
        const matchesAsset = t.asset?.toLowerCase().includes(search);
        if (!matchesTicker && !matchesAsset) return false;
      }

      // Type filter
      if (typeFilter !== "all" && t.assetType !== typeFilter) {
        return false;
      }

      return true;
    });
  }, [trades, yearFilter, tickerFilter, typeFilter]);

  if (loading) {
    return (
      <Card className="p-8 text-center text-[#64748B]">
        Loading investment history...
      </Card>
    );
  }

  if (!summary || trades.length === 0) {
    return (
      <Card className="p-8 text-center text-[#64748B]">
        No investment data available for this senator.
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <div className="text-[28px] font-bold text-[#2563EB]">
            {summary.totalTrades}
          </div>
          <div className="text-[13px] text-[#64748B] font-medium">
            Total Trades
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-bold text-[#059669]">
            {summary.uniqueTickers}
          </div>
          <div className="text-[13px] text-[#64748B] font-medium">
            Unique Tickers
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-bold text-[#7C3AED]">
            {years.length}
          </div>
          <div className="text-[13px] text-[#64748B] font-medium">
            Active Years
          </div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-[28px] font-bold text-[#EA580C]">
            {Object.keys(summary.assetTypes).length}
          </div>
          <div className="text-[13px] text-[#64748B] font-medium">
            Asset Types
          </div>
        </Card>
      </div>

      {/* Top Tickers */}
      {summary.topTickers.length > 0 && (
        <Card className="p-4">
          <h3 className="text-[16px] font-semibold text-[#1E3A5F] mb-3">
            Most Traded Tickers
          </h3>
          <div className="flex flex-wrap gap-2">
            {summary.topTickers.slice(0, 12).map(({ ticker, count }) => (
              <span
                key={ticker}
                className="inline-flex items-center px-3 py-1.5 rounded-full text-[13px] font-medium bg-[#2563EB]/10 text-[#2563EB] cursor-pointer hover:bg-[#2563EB]/20 transition-colors"
                onClick={() => setTickerFilter(ticker)}
              >
                {ticker}
                <span className="ml-1.5 text-[11px] text-[#64748B]">
                  ({count})
                </span>
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-[13px] font-medium text-[#64748B]">Year:</label>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="all">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[13px] font-medium text-[#64748B]">Type:</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            >
              <option value="all">All Types</option>
              {assetTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-[13px] font-medium text-[#64748B]">Search:</label>
            <input
              type="text"
              value={tickerFilter}
              onChange={(e) => setTickerFilter(e.target.value)}
              placeholder="Ticker or asset..."
              className="flex-1 px-3 py-1.5 rounded-lg border border-[#E2E8F0] text-[14px] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20"
            />
          </div>

          {(yearFilter !== "all" || tickerFilter || typeFilter !== "all") && (
            <button
              onClick={() => {
                setYearFilter("all");
                setTickerFilter("");
                setTypeFilter("all");
              }}
              className="text-[13px] text-[#2563EB] hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </Card>

      {/* Trades Table */}
      <Card className="overflow-hidden">
        <div className="p-4 border-b border-[#E2E8F0]">
          <h3 className="text-[16px] font-semibold text-[#1E3A5F]">
            Transaction History
            <span className="ml-2 text-[13px] font-normal text-[#64748B]">
              ({filteredTrades.length} trades)
            </span>
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[#F8FAFC]">
              <tr>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Ticker
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Asset
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Owner
                </th>
                <th className="px-4 py-3 text-left text-[12px] font-semibold text-[#64748B] uppercase tracking-wide">
                  Report
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E2E8F0]">
              {filteredTrades.slice(0, 50).map((trade, i) => (
                <tr key={i} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="px-4 py-3 text-[14px] text-[#1E3A5F] font-medium whitespace-nowrap">
                    {trade.transactionDate || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {trade.ticker ? (
                      <span className="inline-flex px-2 py-0.5 rounded text-[13px] font-semibold bg-[#2563EB]/10 text-[#2563EB]">
                        {trade.ticker}
                      </span>
                    ) : (
                      <span className="text-[#94A3B8]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[14px] text-[#374151] max-w-[200px] truncate">
                    {trade.asset || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex px-2 py-0.5 rounded text-[12px] font-medium bg-[#F1F5F9] text-[#64748B]">
                      {trade.assetType || "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[14px] text-[#64748B]">
                    {trade.owner || "—"}
                  </td>
                  <td className="px-4 py-3">
                    {trade.reportUrl ? (
                      <a
                        href={trade.reportUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[13px] text-[#2563EB] hover:underline"
                      >
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
        </div>
        {filteredTrades.length > 50 && (
          <div className="p-4 text-center text-[13px] text-[#64748B] border-t border-[#E2E8F0]">
            Showing 50 of {filteredTrades.length} trades
          </div>
        )}
      </Card>
    </div>
  );
}
