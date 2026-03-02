"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";

interface PortfolioPanelProps {
  bioguideId: string;
}

export default function PortfolioPanel({ bioguideId }: PortfolioPanelProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/member/${bioguideId}/portfolio`)
      .then((r) => r.json())
      .then((data) => {
        setData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bioguideId]);

  if (loading) {
    return (
      <Card className="mt-8 p-8 text-center text-[#64748B]">
        Loading investment portfolio...
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="mt-8 p-8 text-center text-[#64748B]">
        No investment data available for this senator.
      </Card>
    );
  }

  return (
    <Card className="mt-8">
      <div className="mb-6">
        <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
          Investment Portfolio
        </h2>
        <p className="text-[14px] text-[#64748B]">
          Reported assets and financial holdings
        </p>
      </div>

      <Table headers={["Asset", "Value"]}>
        {data.map((inv, i) => (
          <TableRow key={i}>
            <TableCell className="font-medium text-[#1E3A5F]">
              {inv.asset || inv.name || "Unknown Asset"}
            </TableCell>
            <TableCell className="text-[#64748B]">
              ${typeof inv.value === "number" ? inv.value.toLocaleString() : inv.value || "N/A"}
            </TableCell>
          </TableRow>
        ))}
      </Table>
    </Card>
  );
}
