"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Table, TableRow, TableCell } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";

interface ScheduleItem {
  time: string;
  title: string;
  channel: string;
  type?: string;
}

export default function CspanSchedule() {
  const [shows, setShows] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cspan")
      .then((r) => r.json())
      .then((data) => {
        setShows(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <Card className="mt-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-[24px] font-semibold text-[#1E3A5F]">
            C-SPAN Schedule
          </h2>
          <p className="text-[14px] text-[#64748B]">
            Live government coverage and legislative events
          </p>
        </div>
        <Badge variant="success">LIVE UPDATES</Badge>
      </div>

      {loading ? (
        <div className="p-8 text-center text-[#64748B]">Loading schedule...</div>
      ) : shows.length === 0 ? (
        <div className="p-8 text-center text-[#64748B]">
          No scheduled programs available at this time.
        </div>
      ) : (
        <Table headers={["Time", "Event", "Channel"]}>
          {shows.map((s, i) => (
            <TableRow key={i}>
              <TableCell className="font-semibold text-[#1E3A5F] w-32">
                {s.time}
              </TableCell>
              <TableCell>
                <div className="font-medium text-[#0F172A]">{s.title}</div>
                {s.type && (
                  <span className="text-xs text-[#64748B] mt-1 block">
                    {s.type}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-[#64748B] w-32">
                <Badge variant="neutral">{s.channel}</Badge>
              </TableCell>
            </TableRow>
          ))}
        </Table>
      )}
    </Card>
  );
}
