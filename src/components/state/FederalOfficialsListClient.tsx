"use client";

import { useEffect, useState } from "react";
import { CongressMemberCard } from "@/components/congress/CongressMemberCard";
import type { CongressMemberCardData } from "@/components/congress/CongressMemberCard";

type FederalOfficialsListClientProps = {
  stateCode: string;
};

export default function FederalOfficialsListClient({
  stateCode,
}: FederalOfficialsListClientProps) {
  const [members, setMembers] = useState<CongressMemberCardData[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const [senRes, repRes] = await Promise.all([
          fetch("/api/senators"),
          fetch("/api/representatives"),
        ]);
        const senData = senRes.ok ? await senRes.json() : { senators: [] };
        const repData = repRes.ok ? await repRes.json() : { representatives: [] };
        const code = stateCode.toUpperCase();

        const senators = (senData.senators || [])
          .filter((s: any) => String(s.state || "").toUpperCase() === code)
          .map((s: any) => ({
            bioguideId: s.bioguideId,
            name: s.name,
            party: s.party,
            state: s.state,
            imageUrl: s.imageUrl,
            chamber: "senate" as const,
            estimatedNetWorth: s.estimatedNetWorth,
            tradeCount: s.tradeCount,
          }));

        const reps = (repData.representatives || [])
          .filter((r: any) => String(r.state || "").toUpperCase() === code)
          .map((r: any) => ({
            bioguideId: r.bioguideId,
            name: r.name,
            party: r.party,
            state: r.state,
            district: r.district,
            imageUrl: r.imageUrl,
            chamber: "house" as const,
            estimatedNetWorth: r.estimatedNetWorth,
            tradeCount: r.tradeCount,
          }));

        setMembers([...senators, ...reps]);
      } catch (err) {
        console.error("Error loading federal officials:", err);
      }
    }

    load();
  }, [stateCode]);

  if (members.length === 0) return null;

  return (
    <div className="mt-2 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {members.map((member) => (
        <CongressMemberCard key={member.bioguideId} member={member} />
      ))}
    </div>
  );
}
