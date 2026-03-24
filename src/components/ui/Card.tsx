import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={`bg-card border border-border rounded-[12px] hover:shadow-md transition-shadow duration-300 ${
        padding ? "p-5" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
