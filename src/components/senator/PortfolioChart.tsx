"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
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
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bioguideId]);

  if (loading) {
     return null; // Don't show empty loading state for chart if panel shows loading
  }

  if (data.length === 0) {
    return null;
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
      
      <div className="w-full h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
            <XAxis 
              dataKey="year" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              dy={10}
            />
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: '#64748B', fontSize: 12 }} 
              tickFormatter={(value) => `$${value/1000}k`}
            />
            <Tooltip
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #E2E8F0', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: any) => [`$${value.toLocaleString()}`, "Total Value"]}
              labelStyle={{ color: '#64748B', marginBottom: '4px' }}
            />
            <Line
              type="monotone"
              dataKey="total"
              stroke="#2563eb"
              strokeWidth={3}
              dot={{ r: 4, fill: '#2563eb', strokeWidth: 2, stroke: '#fff' }}
              activeDot={{ r: 6, fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
