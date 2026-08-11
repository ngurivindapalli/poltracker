"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

/** Shape returned by `/api/senator/[id]/donors` (Quiver-backed). */
interface DonorRow {
  name: string;
  amount: number;
  type?: string;
  industry?: string;
}

/** Legacy shape used before Quiver SoT migration. */
interface LegacyDonorRow {
  org_name?: string;
  total?: number;
  indivs?: number;
  pacs?: number;
}

interface LobbyingTableProps {
  bioguideId: string;
}

function normalizeDonor(raw: DonorRow & LegacyDonorRow): DonorRow | null {
  const name = (raw.name || raw.org_name || "").trim();
  const amount =
    typeof raw.amount === "number" && Number.isFinite(raw.amount)
      ? raw.amount
      : typeof raw.total === "number" && Number.isFinite(raw.total)
        ? raw.total
        : null;

  if (!name || amount == null) return null;

  const type =
    raw.type ||
    (typeof raw.pacs === "number" && raw.pacs > 0 ? "PAC" : "Individual");

  return {
    name,
    amount,
    type,
    industry: raw.industry,
  };
}

function formatAmount(value: number): string {
  return `$${Math.round(value).toLocaleString()}`;
}

export default function LobbyingTable({ bioguideId }: LobbyingTableProps) {
  const [donors, setDonors] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/senator/${encodeURIComponent(bioguideId)}/donors`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const rows = Array.isArray(data?.top_donors)
          ? data.top_donors
              .map((d: DonorRow & LegacyDonorRow) => normalizeDonor(d))
              .filter((d: DonorRow | null): d is DonorRow => d != null)
          : [];
        setDonors(rows);
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

  if (loading) return null;
  if (donors.length === 0) return null;

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Top Donors
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Corporate donors linked to this member (Quiver Quantitative)
        </p>
      </div>

      <Table headers={["Organization", "Total Amount", "Type"]}>
        {donors.map((d, i) => (
          <TableRow key={`${d.name}-${i}`}>
            <TableCell className="font-medium text-[#1E3A5F]">
              {d.name}
            </TableCell>
            <TableCell className="text-[#64748B] font-mono">
              {formatAmount(d.amount)}
            </TableCell>
            <TableCell>
              <Badge variant="neutral">
                {d.type === "PAC" ? "PAC" : d.type || "Individual"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </Card>
  );
}
