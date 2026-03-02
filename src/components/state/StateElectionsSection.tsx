"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Election {
  date: string;
  type: string;
  offices: string[];
  source: string;
}

interface StateElectionsSectionProps {
  stateCode: string;
}

export default function StateElectionsSection({ stateCode }: StateElectionsSectionProps) {
  const [elections, setElections] = useState<Election[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchElections() {
      try {
        const res = await fetch(`/api/state/${stateCode.toUpperCase()}/elections`, {
          cache: "no-store"
        });
        if (!res.ok) {
          setElections([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        setElections(data.elections || []);
      } catch (err) {
        setElections([]);
      } finally {
        setLoading(false);
      }
    }
    fetchElections();
  }, [stateCode]);

  if (loading || elections.length === 0) return null;

  function formatDate(dateString: string): string {
    try {
      return new Date(dateString).toLocaleDateString("en-US", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      });
    } catch {
      return dateString;
    }
  }

  return (
    <section className="mb-12">
      <h2 className="text-[24px] font-semibold text-[#1E3A5F] mb-6">
        Upcoming Elections
      </h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {elections.map((election, index) => (
          <Card key={index} className="flex flex-col h-full">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-[18px] font-bold text-[#1E3A5F] mb-1">
                  {formatDate(election.date)}
                </div>
                {election.source && (
                   <div className="text-[12px] text-[#94A3B8]">
                      Source: {election.source}
                   </div>
                )}
              </div>
              <Badge variant={
                  election.type.toLowerCase().includes("primary") ? "default" :
                  election.type.toLowerCase().includes("general") ? "success" : "neutral"
              }>
                {election.type}
              </Badge>
            </div>
            
            <div>
              <div className="text-[13px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
                Offices
              </div>
              <div className="flex flex-wrap gap-2">
                {election.offices.map((office, officeIndex) => (
                  <span
                    key={officeIndex}
                    className="inline-flex items-center px-2.5 py-1 rounded-[6px] text-[13px] font-medium bg-[#F1F5F9] text-[#334155] border border-[#E2E8F0]"
                  >
                    {office}
                  </span>
                ))}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
