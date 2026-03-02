"use client";

import {
  LineChart,
  Line,
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
}

export default function PortfolioChart({ bioguideId }: PortfolioChartProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/member/${bioguideId}/portfolio-history`)
      .then((r) => r.json())
      .then((rawData) => {
        // Clean and validate the data
        const clean = Array.isArray(rawData)
          ? rawData
              .map((d: any) => ({
                year: Number(d?.year),
                value: Number(d?.value),
              }))
              .filter((d) => Number.isFinite(d.year) && Number.isFinite(d.value))
              .sort((a, b) => a.year - b.year)
          : [];

        // Debug in dev
        if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
          console.log("[PortfolioChart] raw:", rawData);
          console.log("[PortfolioChart] clean:", clean);
        }

        setData(clean);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bioguideId]);

  if (loading) {
    return null;
  }

  if (data.length < 2) {
    return (
      <Card className="mt-8">
        <div className="text-gray-400">
          Not enough portfolio history to display a chart.
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Investment Value Over Time
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Estimated total portfolio value by year
        </p>
      </div>

      <div className="w-full h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
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
              tickFormatter={(v) => `$${Math.round(v / 1000)}k`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#fff",
                border: "1px solid #E2E8F0",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
              formatter={(v: any) => [`$${Number(v).toLocaleString()}`, "Total Value"]}
              labelStyle={{ color: "#64748B", marginBottom: "4px" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: "#2563eb", strokeWidth: 2, stroke: "#fff" }}
              activeDot={{ r: 6, fill: "#2563eb" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
