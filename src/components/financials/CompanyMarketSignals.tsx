"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type Lobby = {
  ticker: string | null;
  date: string | null;
  amount: number | null;
  client: string | null;
  issue: string | null;
  specificIssue: string | null;
  registrant: string | null;
};

type Off = {
  ticker: string;
  date: string | null;
  otcShort: number | null;
  otcTotal: number | null;
  dpi: number | null;
};

export default function CompanyMarketSignals({
  bioguideId,
}: {
  bioguideId: string;
}) {
  const [lobbying, setLobbying] = useState<Lobby[]>([]);
  const [off, setOff] = useState<Off[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/member/${bioguideId}/financial-profile`);
        const json = await res.json();
        if (!cancelled) {
          setLobbying(json.corporateLobbying || []);
          setOff(json.offExchange || []);
          setLastUpdated(json.lastUpdated || null);
        }
      } catch {
        if (!cancelled) {
          setLobbying([]);
          setOff([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <section>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Corporate Lobbying
        </h2>
        <Card className="p-6">
          <p className="text-xs text-[#94A3B8] mb-3">
            Company/ticker lobbying for symbols this member has traded (not
            member filings).
          </p>
          {loading ? (
            <div className="text-sm text-[#64748B]">Loading…</div>
          ) : lobbying.length === 0 ? (
            <div className="text-sm text-[#64748B]">No lobbying rows.</div>
          ) : (
            <ul className="space-y-3 max-h-72 overflow-y-auto">
              {lobbying.slice(0, 20).map((r, i) => (
                <li key={i} className="border-b border-[#F1F5F9] pb-2 text-sm">
                  <div className="flex justify-between gap-2">
                    <span className="font-semibold text-[#2563EB]">
                      {r.ticker || r.client || "—"}
                    </span>
                    <span className="text-[#64748B]">{r.date || "—"}</span>
                  </div>
                  <div className="text-[#374151]">
                    {r.amount != null
                      ? `$${Number(r.amount).toLocaleString()}`
                      : "—"}{" "}
                    · {r.issue || "—"}
                  </div>
                  {r.specificIssue && (
                    <div className="text-[12px] text-[#94A3B8] truncate">
                      {r.specificIssue}
                    </div>
                  )}
                  {r.registrant && (
                    <div className="text-[12px] text-[#64748B]">
                      Registrant: {r.registrant}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3">
            <QuiverSourceLabel lastUpdated={lastUpdated} />
          </div>
        </Card>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#1E3A5F] mb-4">
          Off-Exchange Trading
        </h2>
        <Card className="p-6">
          <p className="text-xs text-[#94A3B8] mb-3">
            OTC / dark-pool volume for tickers this member has traded.
          </p>
          {loading ? (
            <div className="text-sm text-[#64748B]">Loading…</div>
          ) : off.length === 0 ? (
            <div className="text-sm text-[#64748B]">No off-exchange rows.</div>
          ) : (
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-[12px] text-[#64748B] uppercase">
                    <th className="py-2">Date</th>
                    <th className="py-2">Ticker</th>
                    <th className="py-2">OTC Short</th>
                    <th className="py-2">OTC Total</th>
                    <th className="py-2">DPI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9]">
                  {off.slice(0, 20).map((r, i) => (
                    <tr key={i}>
                      <td className="py-2">{r.date || "—"}</td>
                      <td className="py-2 font-semibold text-[#2563EB]">
                        {r.ticker}
                      </td>
                      <td className="py-2">
                        {r.otcShort != null
                          ? r.otcShort.toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2">
                        {r.otcTotal != null
                          ? r.otcTotal.toLocaleString()
                          : "—"}
                      </td>
                      <td className="py-2">
                        {r.dpi != null ? r.dpi.toFixed(3) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="mt-3">
            <QuiverSourceLabel lastUpdated={lastUpdated} />
          </div>
        </Card>
      </section>
    </div>
  );
}
