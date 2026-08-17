"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { SearchGroup, SearchHit } from "@/lib/search/catalog";
import { cn } from "@/lib/cn";

const GROUP_ORDER: SearchGroup[] = [
  "People",
  "States",
  "Countries",
  "Intelligence",
  "Pages",
];

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchHit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") close();
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("politeia:search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("politeia:search", onOpen);
    };
  }, [close]);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const handle = window.setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
        const json = await res.json();
        if (!cancelled) {
          setResults(Array.isArray(json.results) ? json.results : []);
          setActive(0);
        }
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, query ? 120 : 0);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [open, query]);

  const grouped = useMemo(() => {
    const map = new Map<SearchGroup, SearchHit[]>();
    for (const g of GROUP_ORDER) map.set(g, []);
    for (const r of results) {
      const list = map.get(r.group) || [];
      list.push(r);
      map.set(r.group, list);
    }
    return GROUP_ORDER.map((g) => ({ group: g, items: map.get(g) || [] })).filter(
      (x) => x.items.length > 0
    );
  }, [results]);

  const flat = grouped.flatMap((g) => g.items);

  const go = (hit?: SearchHit) => {
    const target = hit || flat[active];
    if (!target) return;
    close();
    router.push(target.href);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-foreground/40 px-4 pt-[12vh] backdrop-blur-[2px]"
      onClick={close}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search Politeia"
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-elevated animate-fade-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          <svg
            className="h-4 w-4 text-muted-foreground"
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
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(i + 1, Math.max(flat.length - 1, 0)));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(i - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                go();
              }
            }}
            placeholder="Search people, states, countries, legislation…"
            className="h-12 w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            aria-autocomplete="list"
          />
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground sm:inline">
            ESC
          </kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-2">
          {loading && results.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">Searching…</p>
          ) : flat.length === 0 ? (
            <p className="px-4 py-6 text-sm text-muted-foreground">
              No matches for “{query}”.
            </p>
          ) : (
            grouped.map((g) => (
              <div key={g.group} className="mb-2">
                <div className="px-4 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {g.group}
                </div>
                {g.items.map((item) => {
                  const idx = flat.indexOf(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onMouseEnter={() => setActive(idx)}
                      onClick={() => go(item)}
                      className={cn(
                        "flex w-full flex-col items-start px-4 py-2 text-left text-sm",
                        idx === active ? "bg-muted" : "hover:bg-muted/60"
                      )}
                    >
                      <span className="font-medium text-foreground">{item.title}</span>
                      {item.subtitle ? (
                        <span className="text-xs text-muted-foreground">
                          {item.subtitle}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function openCommandPalette() {
  window.dispatchEvent(new Event("politeia:search"));
}
