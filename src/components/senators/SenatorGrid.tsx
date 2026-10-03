import { CongressMemberCard } from "@/components/congress/CongressMemberCard";

type Senator = {
  id?: string;
  bioguideId?: string;
  name: string;
  state: string;
  party?: string;
  image?: string;
  imageUrl?: string;
  estimatedNetWorth?: number | null;
  tradeCount?: number | null;
};

export default function SenatorGrid({ senators }: { senators: Senator[] }) {
  if (!senators || senators.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="mb-6 text-2xl font-bold">Senators</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {senators.map((senator) => {
          const id = senator.id || senator.bioguideId || "";
          return (
            <CongressMemberCard
              key={id}
              member={{
                bioguideId: id,
                name: senator.name,
                party: senator.party,
                state: senator.state,
                imageUrl: senator.image || senator.imageUrl,
                chamber: "senate",
                estimatedNetWorth: senator.estimatedNetWorth,
                tradeCount: senator.tradeCount,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
