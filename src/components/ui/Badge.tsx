import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  const variants = {
    default: "bg-[#E0F2FE] text-[#0369A1]", // Blue
    success: "bg-[#DCFCE7] text-[#15803D]", // Green
    warning: "bg-[#FEF9C3] text-[#A16207]", // Yellow
    danger: "bg-[#FEE2E2] text-[#B91C1C]",  // Red
    neutral: "bg-[#F1F5F9] text-[#475569]", // Slate
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
