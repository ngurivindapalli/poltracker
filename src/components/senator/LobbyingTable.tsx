"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface Donor {
  org_name: string;
  total: number;
  indivs: number;
  pacs: number;
}

interface LobbyingTableProps {
  bioguideId: string;
}

export default function LobbyingTable({ bioguideId }: LobbyingTableProps) {
  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/senator/${bioguideId}/donors`)
      .then((r) => r.json())
      .then((data) => {
        setDonors(data.top_donors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bioguideId]);

  if (loading) return null;
  if (donors.length === 0) return null;

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Top Donors & Lobbying
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Organizations contributing via employees and PACs
        </p>
      </div>

      <Table headers={["Organization", "Total Amount", "Type"]}>
        {donors.map((d, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium text-[#1E3A5F]">
              {d.org_name}
            </TableCell>
            <TableCell className="text-[#64748B] font-mono">
              ${d.total.toLocaleString()}
            </TableCell>
            <TableCell>
              <Badge variant="neutral">
                {d.pacs > 0 ? "PAC + Indiv" : "Individual"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </Card>
  );
}
