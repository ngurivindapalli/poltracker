"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Bill {
  number: string;
  type: string;
  title: string;
  latestAction: string;
}

interface SenatorBillsSectionProps {
  bioguideId: string;
}

export default function SenatorBillsSection({ bioguideId }: SenatorBillsSectionProps) {
  const [activeTab, setActiveTab] = useState<"sponsored" | "cosponsored">("sponsored");
  const [sponsored, setSponsored] = useState<Bill[]>([]);
  const [cosponsored, setCosponsored] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [openBill, setOpenBill] = useState<string | null>(null);
  const [summary, setSummary] = useState<Record<string, string>>({});
  const [summaryLoading, setSummaryLoading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBills() {
      try {
        const res = await fetch(`/api/congress/${bioguideId}`);
        const data = await res.json();
        console.log("Congress data:", data);
        setSponsored(data.sponsored || []);
        setCosponsored(data.cosponsored || []);
      } catch (e) {
        console.error("Failed to fetch bills", e);
      } finally {
        setLoading(false);
      }
    }
    fetchBills();
  }, [bioguideId]);

  if (loading) {
    return (
      <Card className="p-8 text-center text-[#64748B]">
        Loading legislative records...
      </Card>
    );
  }

  const activeBills = activeTab === "sponsored" ? sponsored : cosponsored;

  return (
    <Card className="mb-10 overflow-hidden">
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
            const billTypeMap: Record<string, string> = {
              "HR": "house-bill",
              "S": "senate-bill",
              "HRES": "house-resolution",
              "SRES": "senate-resolution",
              "HJRES": "house-joint-resolution",
              "SJRES": "senate-joint-resolution",
              "HCONRES": "house-concurrent-resolution",
              "SCONRES": "senate-concurrent-resolution"
            };
            const typeSlug = billTypeMap[bill.type?.toUpperCase()] || "bill";

            return (
              <div
                key={id}
                className="p-4 hover:bg-[#F8FAFC] group transition-colors"
              >
                <div className="flex justify-between items-start gap-4">
                  <div 
                    className="flex-1 cursor-pointer"
                    onClick={() => {
                      const targetUrl = `https://www.congress.gov/bill/119th-congress/${typeSlug}/${bill.number}`;
                      window.open(targetUrl, "_blank");
                    }}
                  >
                    <div className="font-bold text-[#1E3A5F] group-hover:text-[#2563EB] transition-colors">
                      {bill.type.toUpperCase()} {bill.number}
                    </div>
                    <div className="text-[14px] text-[#1E3A5F] mt-1 leading-snug line-clamp-2">
                      {bill.title}
                    </div>
                    <div className="mt-2">
                      <Badge variant="neutral" className="text-[12px]">
                        {bill.latestAction}
                      </Badge>
                    </div>
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

                      const data = await res.json();
                      
                      setSummary(prev => ({
                        ...prev,
                        [id]: data.summary
                      }));
                      
                      setSummaryLoading(null);
                      setOpenBill(id);
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
