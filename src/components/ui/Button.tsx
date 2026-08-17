import React from "react";
import { cn } from "@/lib/cn";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variant === "primary" &&
          "bg-primary text-primary-foreground hover:opacity-90",
        variant === "secondary" && "bg-muted text-foreground hover:bg-muted/80",
        variant === "outline" &&
          "border border-border bg-card text-foreground hover:bg-muted",
        variant === "ghost" &&
          "bg-transparent text-muted-foreground hover:bg-muted hover:text-foreground",
        size === "sm" && "px-3 py-1.5 text-[13px]",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-[15px]",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
