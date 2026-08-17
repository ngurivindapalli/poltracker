"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { SourceBadge } from "@/components/data/SourceBadge";

type Bill = {
  number: string;
  type: string;
  title: string;
  congress: number;
  originChamber?: string;
  latestAction?: string;
  updateDate?: string;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/bills")
      .then((r) => r.json())
      .then((data) => {
        setBills(Array.isArray(data.bills) ? data.bills : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <main className="container-page py-10">
      <PageHeader
        title="Legislation"
        subtitle="Recently updated bills from Congress.gov. Status text is the latest official action, not a Politeia interpretation."
      />
      <SourceBadge source="Congress.gov" className="mb-6" />

      {loading ? (
        <SkeletonTable rows={10} />
      ) : error ? (
        <ErrorState title="Legislation data is temporarily unavailable." />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills loaded"
          description="Congress.gov did not return recent legislation, or the API key is not configured."
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {bills.map((b) => (
            <li key={`${b.congress}-${b.type}-${b.number}`} className="p-4">
              <div className="label-caps">
                {b.type}.{b.number} · {b.congress}th Congress
                {b.originChamber ? ` · ${b.originChamber}` : ""}
              </div>
              <h2 className="mt-1 text-base font-semibold text-foreground">
                {b.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {b.latestAction || "Introduced"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
