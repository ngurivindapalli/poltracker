"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

const ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "trading", label: "Trading" },
  { id: "legislation", label: "Legislation" },
  { id: "news", label: "News" },
  { id: "relationships", label: "Relationships" },
] as const;

export function PoliticianNav() {
  const [active, setActive] = useState("overview");

  useEffect(() => {
    const els = ITEMS.map((i) => document.getElementById(i.id)).filter(
      Boolean
    ) as HTMLElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis?.target?.id) setActive(vis.target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0.1, 0.25, 0.5] }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <nav
      className="sticky top-16 z-30 -mx-4 mb-8 border-b border-border bg-background/90 px-4 backdrop-blur-md sm:-mx-6 sm:px-6"
      aria-label="Profile sections"
    >
      <ul className="flex gap-1 overflow-x-auto py-2">
        {ITEMS.map((item) => (
          <li key={item.id}>
            <a
              href={`#${item.id}`}
              className={cn(
                "inline-flex whitespace-nowrap rounded-md px-3 py-1.5 text-sm",
                active === item.id
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
