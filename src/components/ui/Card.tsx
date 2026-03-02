import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-white border border-[#E2E8F0] rounded-[12px] hover:shadow-md transition-shadow duration-300 ${
        padding ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
