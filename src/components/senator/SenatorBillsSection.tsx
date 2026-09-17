"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

import { buildBillLink } from "@/lib/bills/linkBuilder";

interface Bill {
  number: string;
  type: string;
  congress?: string | number;
  title: string;
  latestAction: string | null;
}

type LoadState = "success" | "empty" | "unsynced";

export type MemberLegislationInitial = {
  sponsored: Bill[];
  cosponsored: Bill[];
  status?: "ok" | "empty" | "unsynced" | string;
  lastUpdated?: string | null;
};

interface SenatorBillsSectionProps {
  bioguideId: string;
  initial?: MemberLegislationInitial;
}

function resolveState(initial?: MemberLegislationInitial): LoadState {
  if (!initial) return "unsynced";
  if (initial.status === "unsynced") return "unsynced";
  if ((initial.sponsored?.length || 0) + (initial.cosponsored?.length || 0) > 0) {
    return "success";
  }
  if (initial.lastUpdated) return "empty";
  return initial.status === "empty" ? "empty" : "unsynced";
}

export default function SenatorBillsSection({ initial }: SenatorBillsSectionProps) {
  const [activeTab, setActiveTab] = useState<"sponsored" | "cosponsored">("sponsored");
  const [sponsored] = useState<Bill[]>(() => initial?.sponsored ?? []);
  const [cosponsored] = useState<Bill[]>(() => initial?.cosponsored ?? []);
  const [state] = useState<LoadState>(() => resolveState(initial));
  const lastUpdated = initial?.lastUpdated ?? null;
  const [openBill, setOpenBill] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);

  if (state === "unsynced") {
    return (
      <Card className="p-8 text-center text-sm text-muted-foreground">
        Legislative records have not been synchronized yet. They appear after the next
        background Congress.gov sync.
      </Card>
    );
  }

  const activeBills = activeTab === "sponsored" ? sponsored : cosponsored;

  return (
    <Card className="mb-10 overflow-hidden">
      {lastUpdated ? (
        <div className="border-b border-[#E2E8F0] bg-[#F8FAFC] px-4 py-2 text-xs text-[#64748B]">
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      ) : null}
      <div className="flex border-b border-[#E2E8F0] bg-[#F8FAFC]">
        <button
          onClick={() => setActiveTab("sponsored")}
          className={`flex-1 py-4 text-[14px] font-semibold transition-colors border-b-2 ${
            activeTab === "sponsored"
              ? "border-[#2563EB] text-[#2563EB] bg-white"
              : "border-transparent text-[#64748B] hover:text-[#1E3A5F] hover:bg-[#F1F5F9]"
          }`}
        >
          Sponsored Legislation ({sponsored.length})
        </button>
        <button
          onClick={() => setActiveTab("cosponsored")}
          className={`flex-1 py-4 text-[14px] font-semibold transition-colors border-b-2 ${
            activeTab === "cosponsored"
              ? "border-[#2563EB] text-[#2563EB] bg-white"
              : "border-transparent text-[#64748B] hover:text-[#1E3A5F] hover:bg-[#F1F5F9]"
          }`}
        >
          Cosponsored Legislation ({cosponsored.length})
        </button>
      </div>

      {activeBills.length === 0 ? (
        <div className="p-8 text-center text-[#64748B] italic">
          No recent {activeTab} legislation found.
        </div>
      ) : (
        <div className="divide-y divide-[#E2E8F0]">
          {activeBills.map((bill) => {
            const id = bill.type + bill.number;
            const open = openBill === id;
            const congressUrl = buildBillLink({
              congress: bill.congress || "",
              type: bill.type,
              number: bill.number,
            });

            return (
              <div
                key={id}
                className="p-4 hover:bg-[#F8FAFC] group transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1 min-w-0">
                    {congressUrl ? (
                      <a
                        href={congressUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block"
                      >
                        <div className="font-bold text-[#1E3A5F] group-hover:text-[#2563EB] transition-colors">
                          {bill.type.toUpperCase()} {bill.number}
                        </div>
                        <div className="text-[14px] text-[#1E3A5F] mt-1 leading-snug line-clamp-2">
                          {bill.title}
                        </div>
                      </a>
                    ) : (
                      <>
                        <div className="font-bold text-[#1E3A5F]">
                          {bill.type.toUpperCase()} {bill.number}
                        </div>
                        <div className="text-[14px] text-[#1E3A5F] mt-1 leading-snug line-clamp-2">
                          {bill.title}
                        </div>
                      </>
                    )}
                    {bill.latestAction ? (
                      <div className="mt-2">
                        <Badge variant="neutral" className="text-[12px]">
                          {bill.latestAction}
                        </Badge>
                      </div>
                    ) : null}
                  </div>

                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-[#2563EB] hover:bg-[#1D4ED8] text-white px-3 py-1.5 rounded text-[13px] font-medium whitespace-nowrap"
                    onClick={async (e) => {
                      e.stopPropagation();

                      if (open) {
                        setOpenBill(null);
                        return;
                      }

                      setSummaryLoading(id);

                      try {
                        const res = await fetch("/api/bill-summary", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json"
                          },
                          body: JSON.stringify({
                            title: bill.title,
                            action: bill.latestAction
                          })
                        });
                        if (!res.ok) return;
                        const data = await res.json();
                        setSummary((prev) => ({
                          ...prev,
                          [id]: data.summary
                        }));
                        setOpenBill(id);
                      } catch {
                        /* keep the bill list usable if summary fails */
                      } finally {
                        setSummaryLoading(null);
                      }
                    }}
                  >
                    {open ? "Hide" : "Summarize"}
                  </button>
                </div>

                {summaryLoading === id && (
                  <div className="mt-3 text-[#64748B]">
                    Generating summary...
                  </div>
                )}

                {open && summary[id] && (
                  <div className="mt-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg p-4">
                    <div className="text-sm text-[#334155] leading-relaxed">
                      {summary[id]}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
