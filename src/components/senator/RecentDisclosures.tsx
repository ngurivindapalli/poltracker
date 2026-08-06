"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";

type Asset = {
  description: string;
  valueLow: number | null;
  valueHigh: number | null;
  incomeType: string | null;
};

type Disclosure = {
  id: string;
  year: number;
  filingType: string;
  sourceUrl: string;
  assets: Asset[];
};

function fmtRange(lo: number | null, hi: number | null) {
  if (lo == null && hi == null) return "—";
  if (lo != null && hi != null) {
    return `$${lo.toLocaleString()} – $${hi.toLocaleString()}`;
  }
  if (lo != null) return `$${lo.toLocaleString()}+`;
  return hi != null ? `$${hi.toLocaleString()}` : "—";
}

export default function RecentDisclosures({ bioguideId }: { bioguideId: string }) {
  const [items, setItems] = useState<Disclosure[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${bioguideId}/disclosures`);
        const json = await res.json();
        if (!cancelled) setItems(json.disclosures || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  return (
    <section>
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
        Recent Financial Disclosures
      </h2>
      <Card className="p-6">
        {loading ? (
          <div className="text-sm text-[#64748B]">Loading disclosures…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-[#64748B]">
            No annual financial disclosure filings imported for this member yet.
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((d) => (
              <div key={d.id}>
                <div className="flex items-baseline justify-between mb-2">
                  <h3 className="font-semibold text-[#1E3A5F]">
                    {d.year} · {d.filingType}
                  </h3>
                  <span className="text-[12px] text-[#94A3B8]">
                    {d.assets.length} asset line{d.assets.length === 1 ? "" : "s"}
                  </span>
                </div>
                <ul className="space-y-1">
                  {d.assets.slice(0, 8).map((a, i) => (
                    <li
                      key={i}
                      className="flex justify-between gap-4 text-sm border-b border-[#F1F5F9] py-1.5"
                    >
                      <span className="text-[#374151] truncate">{a.description}</span>
                      <span className="text-[#64748B] whitespace-nowrap">
                        {fmtRange(a.valueLow, a.valueHigh)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  );
}
