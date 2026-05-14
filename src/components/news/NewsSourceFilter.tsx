"use client"

import { useMemo, useState } from "react"
import {
  NEWS_API_SOURCES,
  ALL_NEWS_SOURCE_IDS,
  DEFAULT_NEWS_SOURCE_IDS,
  newsSourceIdsEqual
} from "@/lib/newsSources"

export type NewsSourceFilterProps = {
  value: string[]
  onChange: (ids: string[]) => void
  defaultCollapsed?: boolean
  className?: string
}

const CATEGORY_ORDER = [
  "Balanced / General",
  "Left / Center-left",
  "Right / Center-right",
  "Business / Economy"
]

export function NewsSourceFilter({
  value,
  onChange,
  defaultCollapsed = true,
  className = ""
}: NewsSourceFilterProps) {
  const [open, setOpen] = useState(!defaultCollapsed)

  const grouped = useMemo(() => {
    const m = new Map<string, typeof NEWS_API_SOURCES>()
    for (const s of NEWS_API_SOURCES) {
      if (!m.has(s.category)) m.set(s.category, [])
      m.get(s.category)!.push(s)
    }
    return m
  }, [])

  const effectiveValue = value.length > 0 ? value : DEFAULT_NEWS_SOURCE_IDS
  const count = value.length === 0 ? DEFAULT_NEWS_SOURCE_IDS.length : value.length
  const totalAvailable = ALL_NEWS_SOURCE_IDS.length

  const toggle = (id: string) => {
    const set = new Set(value.length > 0 ? value : DEFAULT_NEWS_SOURCE_IDS)
    if (set.has(id)) set.delete(id)
    else set.add(id)
    const next = ALL_NEWS_SOURCE_IDS.filter((x) => set.has(x))
    onChange(next.length > 0 ? next : [])
  }

  const selectAll = () => onChange([...ALL_NEWS_SOURCE_IDS])

  /** Clears selection; parent/API treats empty as default balanced mix */
  const clearAll = () => onChange([])

  const resetDefault = () => onChange([...DEFAULT_NEWS_SOURCE_IDS])

  return (
    <div
      className={`rounded-xl border border-border bg-card text-foreground ${className}`}
      role="region"
      aria-label="News source filter"
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold hover:bg-muted/40 transition-colors rounded-xl"
        aria-expanded={open}
      >
        <span>Filter sources</span>
        <span className="flex items-center gap-2 text-xs font-normal text-muted-foreground">
          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-foreground">
            {count}/{totalAvailable}
          </span>
          <svg
            className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-2 space-y-4">
          <p className="text-xs text-muted-foreground">Choose news outlets</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectAll}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
            >
              Select all
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted transition"
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={resetDefault}
              disabled={newsSourceIdsEqual(value.length ? value : DEFAULT_NEWS_SOURCE_IDS, DEFAULT_NEWS_SOURCE_IDS)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition disabled:opacity-40"
            >
              Reset to default
            </button>
          </div>

          {CATEGORY_ORDER.map((cat) => {
            const items = grouped.get(cat)
            if (!items?.length) return null
            return (
              <div key={cat}>
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {cat}
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map((s) => {
                    const active = effectiveValue.includes(s.id)
                    return (
                      <label
                        key={s.id}
                        className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-muted/30 text-muted-foreground hover:border-border/80"
                        }`}
                      >
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary"
                          checked={active}
                          onChange={() => toggle(s.id)}
                        />
                        <span>{s.name}</span>
                      </label>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
