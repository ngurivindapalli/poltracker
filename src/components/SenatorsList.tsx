import { CongressMemberCard } from "@/components/congress/CongressMemberCard";
import type { SenatorSummaryRow } from "@/lib/senators/types";
import { EmptyState } from "@/components/ui/EmptyState";

interface SenatorsListProps {
  senators: SenatorSummaryRow[];
  limit?: number;
}

export default function SenatorsList({
  senators = [],
  limit,
}: SenatorsListProps) {
  const displaySenators = limit ? senators.slice(0, limit) : senators;

  if (displaySenators.length === 0) {
    return (
      <EmptyState
        title="No senators found"
        description="This directory is built from the last successful data sync. If this is empty, the senator summary warehouse has not been generated yet."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {displaySenators.map((senator) => (
        <CongressMemberCard
          key={senator.bioguideId}
          member={{
            bioguideId: senator.bioguideId,
            name: senator.name,
            party: senator.party,
            state: senator.state,
            imageUrl: senator.imageUrl,
            chamber: "senate",
            estimatedNetWorth: senator.estimatedNetWorth,
            tradeCount: senator.tradeCount,
          }}
        />
      ))}
    </div>
  );
}
