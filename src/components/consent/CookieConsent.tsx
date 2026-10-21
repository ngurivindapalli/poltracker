"use client";

import { useEffect, useState } from "react";
import { getAdsenseClient } from "@/lib/ads/config";
import {
  CONSENT_STORAGE_KEY,
  DENIED_CONSENT,
  GRANTED_CONSENT,
  type ConsentState,
} from "@/lib/consent/constants";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function applyConsent(state: ConsentState) {
  if (typeof window === "undefined") return;
  window.gtag?.("consent", "update", state);
}

export function CookieConsent() {
  const adsEnabled = Boolean(getAdsenseClient());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!adsEnabled) return;
    const existing = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!existing) setOpen(true);
    if (existing === "granted") applyConsent(GRANTED_CONSENT);
    if (existing === "denied") applyConsent(DENIED_CONSENT);
  }, [adsEnabled]);

  if (!adsEnabled || !open) return null;

  function choose(value: "granted" | "denied") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, value);
    applyConsent(value === "granted" ? GRANTED_CONSENT : DENIED_CONSENT);
    setOpen(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-border bg-card p-4 shadow-elevated">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Politeia can show labeled advertisements. Choose whether advertising
          cookies may be used. You can change this later in Privacy.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => choose("denied")}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-muted"
          >
            Reject
          </button>
          <button
            onClick={() => choose("granted")}
            className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
