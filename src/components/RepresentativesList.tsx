import { CongressMemberCard } from "@/components/congress/CongressMemberCard";

interface Representative {
  bioguideId: string;
  name: string;
  party?: string | null;
  state?: string | null;
  district?: string | number | null;
  imageUrl?: string | null;
  estimatedNetWorth?: number | null;
  tradeCount?: number | null;
}

interface RepresentativesListProps {
  representatives: Representative[];
  limit?: number;
}

export default function RepresentativesList({
  representatives = [],
  limit,
}: RepresentativesListProps) {
  const displayRepresentatives = limit
    ? representatives.slice(0, limit)
    : representatives;

  if (displayRepresentatives.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        No representatives found.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {displayRepresentatives.map((representative) => (
        <CongressMemberCard
          key={representative.bioguideId}
          member={{
            bioguideId: representative.bioguideId,
            name: representative.name,
            party: representative.party,
            state: representative.state,
            district: representative.district,
            imageUrl: representative.imageUrl,
            chamber: "house",
            estimatedNetWorth: representative.estimatedNetWorth,
            tradeCount: representative.tradeCount,
          }}
        />
      ))}
    </div>
  );
}
