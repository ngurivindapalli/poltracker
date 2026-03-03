"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

interface PortfolioChartProps {
  bioguideId: string;
  senatorName?: string;
}

interface Trade {
  transactionDate?: string;
}

interface YearlyTotals {
  [year: string]: number;
}

export default function PortfolioChart({ bioguideId, senatorName }: PortfolioChartProps) {
  const [data, setData] = useState<{ year: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let trades: Trade[] = [];

        if (senatorName) {
          // Use local STOCK Act data
          const res = await fetch(`/api/investments/${encodeURIComponent(senatorName)}`);
          const rawData = await res.json();
          // API returns { trades, count }
          trades = Array.isArray(rawData.trades) ? rawData.trades : [];
        } else {
          // Fallback to old portfolio-history API
          const res = await fetch(`/api/member/${bioguideId}/portfolio-history`);
          const rawData = await res.json();
          
          // If old API returns year/value format, use it directly
          if (Array.isArray(rawData) && rawData.length > 0 && rawData[0]?.year !== undefined) {
            const clean = rawData
              .map((d: any) => ({
                year: String(d?.year),
                value: Number(d?.value),
              }))
              .filter((d) => d.year && Number.isFinite(d.value))
              .sort((a, b) => a.year.localeCompare(b.year));
            setData(clean);
            setLoading(false);
            return;
          }
        }

        // Transform trades to yearly totals
        const yearlyTotals: YearlyTotals = {};

        trades.forEach((t: Trade) => {
          const year = t.transactionDate?.slice(0, 4);
          if (!year) return;
          if (!yearlyTotals[year]) yearlyTotals[year] = 0;
          yearlyTotals[year] += 1;
        });

        // Convert to chart data format
        const chartData = Object.entries(yearlyTotals)
          .map(([year, value]) => ({ year, value }))
          .sort((a, b) => a.year.localeCompare(b.year));

        // Debug in dev
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          console.log("[PortfolioChart] trades:", trades.length);
          console.log("[PortfolioChart] chartData:", chartData);
        }

        setData(chartData);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [bioguideId, senatorName]);

  if (loading) {
    return null;
  }

  if (data.length < 1) {
    return (
      <Card className="mt-8">
        <div className="text-gray-400">
          Not enough trading history to display a chart.
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Trading Activity Over Time
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Number of trades per year
        </p>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis
              dataKey="year"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#64748B", fontSize: 12 }}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(v: any) => [`${Number(v)} trades`, "Activity"]}
              labelStyle={{ color: "#64748B", marginBottom: "4px" }}
            />
            <Bar
              dataKey="value"
              fill="#2563eb"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
