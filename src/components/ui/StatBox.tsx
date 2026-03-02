import React from "react";
import { Card } from "./Card";

interface StatBoxProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: React.ReactNode;
}

export function StatBox({ label, value, change, changeType = "neutral", icon }: StatBoxProps) {
  return (
    <Card className="flex flex-col justify-between h-full">
      <div className="flex items-start justify-between mb-4">
        <span className="text-[14px] font-semibold text-[#64748B] uppercase tracking-wide">
          {label}
        </span>
        {icon && <div className="text-[#2563EB]">{icon}</div>}
      </div>
      <div>
        <div className="text-[28px] font-bold text-[#1E3A5F] mb-1">{value}</div>
        {change && (
          <div
            className={`text-[14px] font-medium ${
              changeType === "positive"
                ? "text-green-600"
                : changeType === "negative"
                ? "text-red-600"
                : "text-[#64748B]"
            }`}
          >
            {change}
          </div>
        )}
      </div>
    </Card>
  );
}
