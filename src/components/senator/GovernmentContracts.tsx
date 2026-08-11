"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type Contract = {
  ticker: string;
  vendor: string;
  agency: string | null;
  awardDate: string | null;
  description: string | null;
  amount: number | null;
  status: string | null;
};

function fmtUsd(n: number | null) {
  if (n == null || Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function GovernmentContracts({
  bioguideId,
  title = "Government Contracts",
}: {
  bioguideId: string;
  title?: string;
}) {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/member/${bioguideId}/financial-profile`);
        const json = await res.json();
        if (!cancelled) {
          setContracts(json.governmentContracts || []);
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) setContracts([]);
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
      <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">{title}</h2>
      <Card className="p-0 overflow-hidden">
        <p className="px-4 pt-4 text-xs text-[#94A3B8]">
          Company/agency awards for tickers this member has traded (contracts are
          company-scoped, not politician awards).
        </p>
        {loading ? (
          <div className="p-6 text-sm text-[#64748B]">Loading contracts…</div>
        ) : contracts.length === 0 ? (
          <div className="p-6 text-sm text-[#64748B]">
            No federal contracts found for companies this member has traded.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E2E8F0] text-left bg-[#F8FAFC]">
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Award
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Vendor
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Agency
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Value
                  </th>
                  <th className="py-3 px-4 text-[12px] font-semibold text-[#64748B] uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {contracts.map((c, i) => (
                  <tr key={i} className="hover:bg-[#F8FAFC]">
                    <td className="py-3 px-4 text-[#1E3A5F] whitespace-nowrap">
                      {c.awardDate || "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-[#2563EB]">{c.vendor}</span>
                      {c.description && (
                        <div className="text-[12px] text-[#64748B] max-w-[280px] truncate">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-[#374151]">{c.agency || "—"}</td>
                    <td className="py-3 px-4 text-[#111827] font-medium">
                      {fmtUsd(c.amount)}
                    </td>
                    <td className="py-3 px-4 capitalize text-[#64748B]">
                      {c.status || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="px-4 py-3 border-t border-[#F1F5F9]">
          <QuiverSourceLabel lastUpdated={lastUpdated} />
        </div>
      </Card>
    </section>
  );
}
