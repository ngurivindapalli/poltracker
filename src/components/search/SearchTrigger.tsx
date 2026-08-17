"use client";

import { openCommandPalette } from "@/components/search/CommandPalette";
import { cn } from "@/lib/cn";

export function SearchTrigger({
  className,
  label = "Search",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      onClick={openCommandPalette}
      className={cn(
        "inline-flex items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground",
        className
      )}
      aria-label="Open search"
    >
      <svg
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z"
        />
      </svg>
      <span className="hidden sm:inline">{label}</span>
      <kbd className="ml-2 hidden rounded border border-border px-1.5 py-[1px] text-[10px] leading-5 lg:inline">
        ⌘K
      </kbd>
    </button>
  );
}
