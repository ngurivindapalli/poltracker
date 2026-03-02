import Link from "next/link";
import ClientImage from "@/components/ClientImage";

type Senator = {
  bioguideId: string;
  name: string;
  state: string;
  party?: string;
  imageUrl?: string;
};

export default function SenatorCard({ s }: { s: Senator }) {
  return (
    <Link
      href={`/senator/${s.bioguideId}`}
      className="group rounded-2xl border bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border bg-gray-50">
          <ClientImage
            src={s.imageUrl || "/images/placeholder-avatar.svg"}
            alt={s.name}
            fill
            className="object-cover"
            sizes="64px"
            fallbackSrc="/images/placeholder-avatar.svg"
          />
        </div>

        <div className="min-w-0">
          <div className="truncate text-lg font-semibold text-gray-900">{s.name}</div>
          <div className="text-sm text-gray-600">
            {s.state}{s.party ? ` • ${s.party}` : ""}
          </div>
        </div>
      </div>

      <div className="mt-3 text-sm font-medium text-blue-600 opacity-0 transition group-hover:opacity-100">
        View profile →
      </div>
    </Link>
  );
}
