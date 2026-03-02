import SenatorCard from "./SenatorCard";

type Senator = {
  bioguideId: string;
  name: string;
  state: string;
  party?: string;
  imageUrl?: string;
};

export default function SenatorsGrid({ senators }: { senators: Senator[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {senators.map((s) => (
        <SenatorCard key={s.bioguideId} s={s} />
      ))}
    </div>
  );
}
