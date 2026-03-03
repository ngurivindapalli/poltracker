"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Card } from "@/components/ui/Card";
import { toSlug } from "@/lib/slug";

interface TimeseriesPoint {
  date: string;
  tradeCount: number;
  cumulativeTrades: number;
}

interface Summary {
  senator: string;
  totalTrades: number;
  uniqueTickers: number;
  startDate?: string;
  endDate?: string;
  tradesByYear: Record<string, number>;
}

interface TradingActivityChartProps {
  senatorName: string;
}

export default function TradingActivityChart({ senatorName }: TradingActivityChartProps) {
  const [timeseries, setTimeseries] = useState<TimeseriesPoint[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const slug = toSlug(senatorName);

    fetch(`/api/portfolio/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        setTimeseries(data.timeseries || []);
        setSummary(data.summary || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [senatorName]);

  if (loading) {
    return null;
  }

  if (!summary || timeseries.length < 2) {
    return (
      <Card className="p-6">
        <div className="text-[#64748B] text-center">
          Not enough trading history to display a chart.
        </div>
      </Card>
    );
  }

  // Calculate stats
  const latestPoint = timeseries[timeseries.length - 1];
  const firstPoint = timeseries[0];
  const totalTrades = latestPoint?.cumulativeTrades || 0;

  // Get most active year
  const yearEntries = Object.entries(summary.tradesByYear || {});
  const mostActiveYear = yearEntries.length > 0
    ? yearEntries.sort((a, b) => b[1] - a[1])[0]
    : null;

  // Sample data for chart (every 4th point to reduce density)
  const chartData = timeseries.filter((_, i) => i % 4 === 0 || i === timeseries.length - 1);

  return (
    <Card className="p-6">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Trading Activity (Last 4 Years)
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Cumulative stock trades over time
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#F8FAFC] rounded-lg p-4">
          <div className="text-[24px] font-bold text-[#2563EB]">
            {totalTrades}
          </div>
          <div className="text-[12px] text-[#64748B] font-medium">
            Total Trades
          </div>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-4">
          <div className="text-[24px] font-bold text-[#059669]">
            {summary.uniqueTickers}
          </div>
          <div className="text-[12px] text-[#64748B] font-medium">
            Unique Tickers
          </div>
        </div>
        <div className="bg-[#F8FAFC] rounded-lg p-4">
          <div className="text-[24px] font-bold text-[#7C3AED]">
            {mostActiveYear ? mostActiveYear[0] : "—"}
          </div>
          <div className="text-[12px] text-[#64748B] font-medium">
            Most Active Year
            {mostActiveYear && (
              <span className="ml-1 text-[#94A3B8]">({mostActiveYear[1]} trades)</span>
            )}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="w-full h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorTrades" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              dy={10}
              tickFormatter={(value) => {
                const d = new Date(value);
                return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
              }}
              interval="preserveStartEnd"
              minTickGap={60}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 11 }}
              width={40}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(value: any) => [`${value} trades`, "Cumulative"]}
              labelFormatter={(label) => {
                const d = new Date(label);
                return d.toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                });
              }}
              labelStyle={{ color: "#64748B", marginBottom: "4px" }}
            />
            <Area
              type="monotone"
              dataKey="cumulativeTrades"
              stroke="#2563EB"
              strokeWidth={2}
              fill="url(#colorTrades)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Date Range */}
      <div className="mt-4 text-center text-[12px] text-[#94A3B8]">
        {summary.startDate && summary.endDate && (
          <>
            Data from {new Date(summary.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" to "}
            {new Date(summary.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </>
        )}
      </div>
    </Card>
  );
}
