"use client";

import { useEffect, useState } from "react";

export function AiOverviewButton({ bioguideId }: { bioguideId: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  async function openOverview() {
    setOpen(true);
    if (summary || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/member/${encodeURIComponent(bioguideId)}/overview`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.error || "Overview is unavailable.");
        return;
      }
      setSummary(data.summary || "");
      setNotice(data.notice || null);
      setGeneratedAt(data.generatedAt || null);
    } catch {
      setError("Overview is unavailable. Please try again shortly.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openOverview}
        className="inline-flex shrink-0 items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground hover:bg-muted"
      >
        <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-primary">
          AI
        </span>
        Overview
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex justify-end bg-[hsl(var(--foreground)/0.45)]"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="AI Overview"
            className="h-full w-full max-w-lg overflow-y-auto border-l border-border bg-[hsl(var(--card))] p-6 text-card-foreground shadow-elevated"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  AI-generated
                </p>
                <h2 className="text-lg font-semibold">AI Overview</h2>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <p className="mb-4 text-xs leading-relaxed text-muted-foreground">
              Summarizes records already stored in Politeia. It does not browse the web,
              rank this member, or make a recommendation.
            </p>
            {loading ? (
              <p className="text-sm text-muted-foreground">Preparing overview...</p>
            ) : null}
            {error ? <p className="text-sm text-muted-foreground">{error}</p> : null}
            {notice ? <p className="mb-3 text-sm text-muted-foreground">{notice}</p> : null}
            {summary ? (
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                {summary}
              </div>
            ) : null}
            {generatedAt ? (
              <p className="mt-6 text-xs text-muted-foreground">
                Generated {new Date(generatedAt).toLocaleString()}
              </p>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
