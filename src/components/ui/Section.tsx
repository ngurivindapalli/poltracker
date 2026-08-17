import React from "react";
import { cn } from "@/lib/cn";

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export function Section({
  title,
  subtitle,
  children,
  className = "",
  id,
}: SectionProps) {
  return (
    <section id={id} className={cn("section", className)}>
      {(title || subtitle) && (
        <div className="mb-8 max-w-3xl">
          {title && <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>}
          {subtitle && (
            <p className="mt-2 text-base text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </section>
  );
}
