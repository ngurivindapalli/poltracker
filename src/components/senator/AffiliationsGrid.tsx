"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Affiliation {
  organization: string;
  role?: string;
  type?: string;
}

interface AffiliationsGridProps {
  bioguideId: string;
}

export default function AffiliationsGrid({ bioguideId }: AffiliationsGridProps) {
  const [affiliations, setAffiliations] = useState<Affiliation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/senator/${bioguideId}/affiliations`)
      .then((r) => r.json())
      .then((data) => {
        setAffiliations(data.affiliations || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [bioguideId]);

  if (loading) return (
      <Card className="p-6 text-center text-[#64748B] italic">
          Loading affiliations...
      </Card>
  );
  
  if (affiliations.length === 0) return (
      <Card className="p-6 text-center text-[#64748B] italic bg-[#F8FAFC]">
          No known affiliations found.
      </Card>
  );

  return (
    <div className="space-y-3">
        {affiliations.map((a, i) => (
          <Card key={i} className="p-4 hover:shadow-sm transition-all border-[#E2E8F0]">
            <div>
              <h3 className="text-[14px] font-bold text-[#1E3A5F] mb-1 leading-snug">
                {a.organization}
              </h3>
              {a.role && (
                <p className="text-[13px] text-[#64748B] mb-2">
                  {a.role}
                </p>
              )}
            </div>
            <div>
               <Badge variant="neutral" className="text-[10px] uppercase tracking-wide">
                 {a.type || "Affiliation"}
               </Badge>
            </div>
          </Card>
        ))}
    </div>
  );
}
