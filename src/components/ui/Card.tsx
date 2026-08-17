import React from "react";
import { cn } from "@/lib/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

export function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card shadow-subtle",
        padding && "p-5",
        className
      )}
    >
      {children}
    </div>
  );
}
