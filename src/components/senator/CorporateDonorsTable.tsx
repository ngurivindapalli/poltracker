"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { QuiverSourceLabel } from "@/components/financials/QuiverSourceLabel";

type DonorRow = {
  company: string | null;
  pac: string | null;
  amount: number | null;
  date: string | null;
  cycle: number | null;
  ticker: string | null;
};

function formatAmount(value: number | null) {
  if (value == null || !Number.isFinite(value)) return "—";
  return `$${Math.round(value).toLocaleString()}`;
}

function normalizeDonor(d: Record<string, unknown>): DonorRow {
  return {
    company: d.company != null ? String(d.company) : d.vendor != null ? String(d.vendor) : null,
    pac: d.pac != null ? String(d.pac) : null,
    amount:
      typeof d.amount === "number" && Number.isFinite(d.amount) ? d.amount : null,
    date: d.date != null ? String(d.date) : d.donationDate != null ? String(d.donationDate) : null,
    cycle:
      typeof d.cycle === "number"
        ? d.cycle
        : d.cycle != null
          ? Number(d.cycle)
          : null,
    ticker: d.ticker != null ? String(d.ticker) : null,
  };
}

export default function CorporateDonorsTable({
  bioguideId,
}: {
  bioguideId: string;
}) {
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/member/${encodeURIComponent(bioguideId)}/financial-profile`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.corporateDonors)
          ? data.corporateDonors.map((d: Record<string, unknown>) => normalizeDonor(d))
          : [];
        setDonors(rows);
        setLastUpdated(data.lastUpdated || null);
      })
      .catch(() => {
        if (!cancelled) setDonors([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [bioguideId]);

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading donors…</p>;
  }

  if (donors.length === 0) {
    return (
      <EmptyState
        title="No corporate PAC donations in cache"
        description="Quiver may not have donor rows for this member, or the cache may need a sync."
      />
    );
  }

  return (
    <Card className="overflow-hidden p-0">
      <Table headers={["Company", "PAC", "Amount", "Date", "Cycle"]}>
        {donors.map((d, i) => (
          <TableRow key={`${d.company}-${i}`}>
            <TableCell className="font-medium">{d.company || "—"}</TableCell>
            <TableCell className="text-muted-foreground">{d.pac || "—"}</TableCell>
            <TableCell className="tabular-nums">{formatAmount(d.amount)}</TableCell>
            <TableCell className="text-muted-foreground">{d.date || "—"}</TableCell>
            <TableCell>{d.cycle ?? "—"}</TableCell>
          </TableRow>
        ))}
      </Table>
      <div className="border-t border-border px-4 py-3">
        <QuiverSourceLabel lastUpdated={lastUpdated} />
      </div>
    </Card>
  );
}
