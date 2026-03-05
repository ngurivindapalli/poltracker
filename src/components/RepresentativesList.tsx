"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Representative {
  bioguideId: string;
  name: string;
  party?: string;
  state?: string;
  district?: string;
  imageUrl?: string;
}

// Get official Congressional photo URL
const getImageUrl = (bioguideId: string) => {
  if (!bioguideId) return "";
  const firstLetter = bioguideId[0]?.toUpperCase() || "A";
  return `https://bioguide.congress.gov/bioguide/photo/${firstLetter}/${bioguideId}.jpg`;
};

interface RepresentativesListProps {
  representatives: Representative[];
  limit?: number;
}

export default function RepresentativesList({ representatives = [], limit }: RepresentativesListProps) {
  const displayRepresentatives = limit ? representatives.slice(0, limit) : representatives;

  if (displayRepresentatives.length === 0) {
    return (
      <div className="text-[#64748B] p-8 text-center bg-white rounded-lg border border-[#E2E8F0]">
        No representatives found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {displayRepresentatives.map((representative) => {
        const isDemocrat = representative.party?.toLowerCase().includes("democrat");
        const isRepublican = representative.party?.toLowerCase().includes("republican");
        
        return (
          <Link 
            key={representative.bioguideId} 
            href={`/representatives/${representative.bioguideId}`}
            className="block h-full group"
          >
            <Card className="h-full flex flex-col items-center text-center p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
              <div className="relative mb-4 w-24 h-24 rounded-full overflow-hidden border-2 border-[#E2E8F0] shadow-sm">
                <img
                  src={getImageUrl(representative.bioguideId)}
                  alt={representative.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              </div>

              <h3 className="text-[18px] font-semibold text-[#1E3A5F] mb-2 group-hover:text-[#2563EB] transition-colors">
                {representative.name}
              </h3>

              <div className="flex items-center gap-2 mb-3">
                <Badge variant={isDemocrat ? "default" : isRepublican ? "danger" : "neutral"}>
                  {representative.party || "—"}
                </Badge>
                <span className="text-sm font-medium text-[#64748B]">
                  {representative.state || "—"}
                  {representative.district && `-${representative.district}`}
                </span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
