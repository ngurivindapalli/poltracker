"use client";

import { useEffect } from "react";
import { getAdsenseClient, getAdsenseSlot } from "@/lib/ads/config";

type SlotName = "HOME" | "CONTENT";

export function GoogleAdSlot({ slot }: { slot: SlotName }) {
  const client = getAdsenseClient();
  const slotId = getAdsenseSlot(slot);

  useEffect(() => {
    if (!client || !slotId) return;
    if (typeof window === "undefined") return;
    const consent = window.localStorage.getItem("politeia-consent-v2");
    if (consent !== "granted") return;
    try {
      ((window as Window & { adsbygoogle?: unknown[] }).adsbygoogle =
        (window as Window & { adsbygoogle?: unknown[] }).adsbygoogle || []).push(
        {}
      );
    } catch {
      // Ignore unavailable ad script.
    }
  }, [client, slotId]);

  if (!client || !slotId) return null;

  return (
    <aside
      className="my-6 rounded-lg border border-border bg-muted/30 p-3"
      aria-label="Advertisement"
    >
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Advertisement
      </p>
      <ins
        className="adsbygoogle block min-h-[90px] w-full"
        style={{ display: "block" }}
        data-ad-client={client}
        data-ad-slot={slotId}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
