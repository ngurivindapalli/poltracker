"use client";

import { useCallback, useEffect, useState } from "react";
import { formatRelativeAgo } from "@/lib/format";
import { formatBillIdentifier } from "@/lib/bills/linkBuilder";
import type { RecentLegislationBill } from "@/lib/legislation/recent";

const POLL_MS = 60_000;

type FeedStatus = "loading" | "ok" | "empty" | "unavailable";

type FeedResponse = {
  bills?: RecentLegislationBill[];
  fetchedAt?: string;
  status?: FeedStatus;
};

export function LatestLegislation() {
  const [bills, setBills] = useState<RecentLegislationBill[]>([]);
  const [status, setStatus] = useState<FeedStatus>("loading");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [now, setNow] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/legislation/latest", { cache: "no-store" });
      if (!res.ok) {
        setStatus((prev) => (prev === "ok" ? "ok" : "unavailable"));
        return;
      }
      const data = (await res.json()) as FeedResponse;
      const next = Array.isArray(data.bills) ? data.bills : [];
      if (next.length > 0) {
        setBills(next);
        setStatus("ok");
      } else if (data.status === "unavailable") {
        setStatus((prev) => (prev === "ok" ? "ok" : "unavailable"));
      } else {
        setStatus((prev) => (prev === "ok" ? "ok" : "empty"));
      }
      if (data.fetchedAt) setFetchedAt(data.fetchedAt);
    } catch {
      setStatus((prev) => (prev === "ok" ? "ok" : "unavailable"));
    }
  }, []);

  useEffect(() => {
    load();
    const poll = window.setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_MS);
    return () => window.clearInterval(poll);
  }, [load]);

  useEffect(() => {
    setNow(Date.now());
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, []);

  const updatedLabel =
    now && fetchedAt ? formatRelativeAgo(fetchedAt, now) : "Updated recently";

  return (
    <section className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <div className="overflow-hidden rounded-lg border border-border bg-card">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
          <div>
            <h2 className="text-sm font-semibold tracking-tight text-foreground">
              Latest Legislative Activity
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Recently updated bills from Congress.gov
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full bg-success"
              aria-hidden
            />
            <span className="tabular-nums">{updatedLabel}</span>
          </div>
        </div>

        {status === "loading" ? (
          <ul className="divide-y divide-border" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="px-4 py-3 sm:px-5">
                <div className="h-3 w-16 animate-shimmer rounded bg-muted" />
                <div className="mt-2 h-4 w-4/5 animate-shimmer rounded bg-muted" />
                <div className="mt-2 h-3 w-2/5 animate-shimmer rounded bg-muted" />
              </li>
            ))}
          </ul>
        ) : status === "unavailable" && bills.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
            Legislative activity temporarily unavailable.
          </p>
        ) : bills.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground sm:px-5">
            Waiting for legislative activity.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {bills.map((bill) => {
              const identifier = formatBillIdentifier(
                bill.billType,
                bill.billNumber
              );
              const actionTime =
                now && bill.updateDate
                  ? formatRelativeAgo(bill.updateDate, now)
                  : null;
              const content = (
                <>
                  <div className="flex items-start justify-between gap-3">
                    <span className="label-caps shrink-0">{identifier}</span>
                    {actionTime ? (
                      <span className="shrink-0 tabular-nums text-[11px] text-muted-foreground">
                        {actionTime}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-foreground">
                    {bill.title}
                  </p>
                  {bill.latestAction ? (
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                      {bill.latestAction}
                    </p>
                  ) : null}
                </>
              );

              return (
                <li key={bill.id}>
                  {bill.congressUrl ? (
                    <a
                      href={bill.congressUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block px-4 py-3 transition-colors hover:bg-muted/50 sm:px-5"
                    >
                      {content}
                    </a>
                  ) : (
                    <div className="px-4 py-3 sm:px-5">{content}</div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
