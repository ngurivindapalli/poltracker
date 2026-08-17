"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { SkeletonTable } from "@/components/ui/Skeleton";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import Link from "next/link";

interface ScheduleItem {
  time: string;
  title: string;
  channel: string;
  type?: string;
}

export default function CspanSchedule() {
  const [shows, setShows] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/cspan")
      .then((r) => r.json())
      .then((data) => {
        setShows(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, []);

  return (
    <Card className="mt-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Live government coverage</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Public C-SPAN programming. Not produced by Politeia.
          </p>
        </div>
        <Link href="/cspan" className="text-sm font-medium hover:underline">
          Full schedule
        </Link>
      </div>

      {loading ? (
        <SkeletonTable rows={5} />
      ) : error ? (
        <ErrorState title="C-SPAN schedule is temporarily unavailable." />
      ) : shows.length === 0 ? (
        <EmptyState title="No scheduled programs available at this time." />
      ) : (
        <Table headers={["Time", "Event", "Channel"]}>
          {shows.slice(0, 8).map((s, i) => (
            <TableRow key={i}>
              <TableCell className="w-32 font-medium tabular-nums">
                {s.time}
              </TableCell>
              <TableCell>
                <div className="font-medium text-foreground">{s.title}</div>
                {s.type && (
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {s.type}
                  </span>
                )}
              </TableCell>
              <TableCell className="w-32">
                <Badge variant="neutral">{s.channel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </Card>
  );
}
