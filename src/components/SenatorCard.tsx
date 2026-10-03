import { CongressMemberCard } from "@/components/congress/CongressMemberCard";
import type { SenatorLite } from "@/lib/types";

export default function SenatorCard({ senator }: { senator: SenatorLite }) {
  return (
    <CongressMemberCard
      member={{
        bioguideId: senator.bioguideId,
        name: senator.name,
        party: senator.party,
        state: senator.state,
        imageUrl: senator.imageUrl,
        chamber: "senate",
      }}
    />
  );
}
