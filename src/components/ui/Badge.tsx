import React from "react";
import { cn } from "@/lib/cn";
import { partyKind } from "@/lib/format";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "neutral" | "party";
  party?: string | null;
}

export function Badge({
  children,
  variant = "default",
  party,
  className = "",
  style,
  ...props
}: BadgeProps) {
  const kind = partyKind(party);
  const variants = {
    default: "bg-muted text-foreground",
    success: "bg-success/10 text-success",
    warning: "bg-warning/10 text-warning",
    danger: "bg-destructive/10 text-destructive",
    neutral: "bg-muted text-muted-foreground",
    party:
      kind === "democrat"
        ? "bg-party-d/10 text-party-d"
        : kind === "republican"
          ? "bg-party-r/10 text-party-r"
          : kind === "independent"
            ? "bg-party-i/10 text-party-i"
            : "bg-muted text-muted-foreground",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        variants[variant],
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </span>
  );
}
