import SenatorCard from "./SenatorCard";

type Senator = {
  bioguideId: string;
  name: string;
  state: string;
  party?: string;
  imageUrl?: string;
  estimatedNetWorth?: number | null;
  tradeCount?: number | null;
};

export default function SenatorsGrid({ senators }: { senators: Senator[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {senators.map((s) => (
        <SenatorCard
          key={s.bioguideId}
          s={{
            bioguideId: s.bioguideId,
            name: s.name,
            state: s.state,
            party: s.party,
            imageUrl: s.imageUrl,
            estimatedNetWorth: s.estimatedNetWorth,
            tradeCount: s.tradeCount,
          }}
        />
      ))}
    </div>
  );
}
