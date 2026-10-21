"use client";

import { useEffect, useState } from "react";
import { getAdsenseClient } from "@/lib/ads/config";
import {
  CONSENT_STORAGE_KEY,
  DENIED_CONSENT,
  GRANTED_CONSENT,
} from "@/lib/consent/constants";

export function PrivacyConsentControls() {
  const adsEnabled = Boolean(getAdsenseClient());
  const [choice, setChoice] = useState<"granted" | "denied" | "unset">("unset");

  useEffect(() => {
    const stored = window.localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "granted" || stored === "denied") setChoice(stored);
  }, []);

  if (!adsEnabled) {
    return (
      <p>
        Advertising cookies are not active because no AdSense publisher ID is
        configured.
      </p>
    );
  }

  function update(next: "granted" | "denied") {
    window.localStorage.setItem(CONSENT_STORAGE_KEY, next);
    window.gtag?.(
      "consent",
      "update",
      next === "granted" ? GRANTED_CONSENT : DENIED_CONSENT
    );
    setChoice(next);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-sm text-foreground">Advertising cookies</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Current choice: {choice}
      </p>
      <div className="mt-3 flex gap-2">
        <button
          onClick={() => update("denied")}
          className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted"
        >
          Reject ads cookies
        </button>
        <button
          onClick={() => update("granted")}
          className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground"
        >
          Accept ads cookies
        </button>
      </div>
    </div>
  );
}
