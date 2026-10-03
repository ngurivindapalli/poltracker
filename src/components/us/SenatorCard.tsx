import { CongressMemberCard } from "@/components/congress/CongressMemberCard";

type Senator = {
  bioguideId: string;
  name: string;
  state: string;
  party?: string;
  imageUrl?: string;
  estimatedNetWorth?: number | null;
  tradeCount?: number | null;
};

export default function SenatorCard({ s }: { s: Senator }) {
  return (
    <CongressMemberCard
      member={{
        bioguideId: s.bioguideId,
        name: s.name,
        party: s.party,
        state: s.state,
        imageUrl: s.imageUrl,
        chamber: "senate",
        estimatedNetWorth: s.estimatedNetWorth,
        tradeCount: s.tradeCount,
      }}
    />
  );
}
