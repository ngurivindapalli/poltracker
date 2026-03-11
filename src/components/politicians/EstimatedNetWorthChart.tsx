"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { formatCompactCurrency, formatDateHuman } from "@/lib/formatters";
import { Card } from "@/components/ui/Card";

type NetWorthData = {
  bioguideId: string;
  label: string;
  disclaimer: string;
  officeStart: string | null;
  firstTradeDate: string | null;
  latestEstimate: number;
  totalEstimatedPurchases: number;
  totalEstimatedSales: number;
  numberOfTrades: number;
  series: Array<{ date: string; value: number }>;
};

interface EstimatedNetWorthChartProps {
  bioguideId: string;
}

export default function EstimatedNetWorthChart({
  bioguideId,
}: EstimatedNetWorthChartProps) {
  const [data, setData] = useState<NetWorthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/members/${encodeURIComponent(bioguideId)}/estimated-net-worth`
        );

        if (!res.ok) {
          throw new Error(`Failed to fetch: ${res.status}`);
        }

        const json = await res.json();

        if (!cancelled) {
          setData(json);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load data");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-3 shadow-lg">
          <p className="text-[12px] font-semibold text-[#64748B] mb-1">
            {formatDateHuman(label)}
          </p>
          <p className="text-[14px] font-bold text-[#1E3A5F]">
            {formatCompactCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Format date for X-axis
  const formatXAxisDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr;
      return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
    } catch {
      return dateStr;
    }
  };

  // Format currency for Y-axis
  const formatYAxisCurrency = (value: number) => {
    return formatCompactCurrency(value);
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6 bg-amber-50 border-amber-100">
        <p className="text-sm text-amber-800 text-center">
          Unable to load estimated portfolio value data.
        </p>
      </Card>
    );
  }

  if (!data || data.series.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-2">
          Estimated Disclosed Portfolio Value Over Time
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Based on public trade disclosures and midpoint estimates of reported ranges. Not actual net worth.
        </p>
        <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-8 text-center">
          <p className="text-sm text-[#64748B]">
            No disclosure-based estimate available for this member yet.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-2">
          Estimated Disclosed Portfolio Value Over Time
        </h2>
        <p className="text-sm text-[#64748B] mb-4">
          Based on public trade disclosures and midpoint estimates of reported ranges. Not actual net worth.
        </p>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Latest Estimate
            </div>
            <div className="text-[18px] font-bold text-[#1E3A5F]">
              {formatCompactCurrency(data.latestEstimate)}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Est. Purchases
            </div>
            <div className="text-[18px] font-bold text-[#1E3A5F]">
              {formatCompactCurrency(data.totalEstimatedPurchases)}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Est. Sales
            </div>
            <div className="text-[18px] font-bold text-[#1E3A5F]">
              {formatCompactCurrency(data.totalEstimatedSales)}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              Trade Count
            </div>
            <div className="text-[18px] font-bold text-[#1E3A5F]">
              {data.numberOfTrades}
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-3">
            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
              First Trade
            </div>
            <div className="text-[14px] font-medium text-[#1E3A5F]">
              {data.firstTradeDate
                ? formatDateHuman(data.firstTradeDate)
                : "—"}
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.series} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              tickFormatter={formatXAxisDate}
              stroke="#64748B"
              style={{ fontSize: "11px" }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tickFormatter={formatYAxisCurrency}
              stroke="#64748B"
              style={{ fontSize: "11px" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563EB"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "#2563EB" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 pt-4 border-t border-[#E2E8F0]">
        <div className="flex items-start gap-2">
          <svg
            className="w-4 h-4 text-[#64748B] mt-0.5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-[11px] text-[#64748B] leading-relaxed">
            <p className="font-semibold mb-1">Important Notes:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>
                Trade disclosures use ranges, not exact numbers. Values shown are midpoint estimates.
              </li>
              <li>
                Assets outside congressional trading disclosures are not included in this estimate.
              </li>
              <li>
                Starting holdings before the first disclosed trade are unknown and not reflected.
              </li>
              <li>
                This is not an audited net worth calculation—it is a disclosure-based estimate only.
              </li>
            </ul>
          </div>
        </div>
      </div>
    </Card>
  );
}
