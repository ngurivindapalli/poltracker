import React from "react";
import { cn } from "@/lib/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  className?: string;
  action?: React.ReactNode;
  kicker?: string;
}

export function PageHeader({
  title,
  subtitle,
  className = "",
  action,
  kicker,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col justify-between gap-4 border-b border-border pb-6 md:flex-row md:items-end",
        className
      )}
    >
      <div>
        {kicker ? <p className="label-caps mb-2">{kicker}</p> : null}
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-2 max-w-3xl text-base text-muted-foreground sm:text-lg">
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
