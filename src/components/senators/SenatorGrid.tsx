"use client";

import Link from "next/link";
import ClientImage from "@/components/ClientImage";

type Senator = {
  id?: string;
  bioguideId?: string;
  name: string;
  state: string;
  party?: string;
  image?: string;
  imageUrl?: string;
};

export default function SenatorGrid({ senators }: { senators: Senator[] }) {
  if (!senators || senators.length === 0) return null;

  return (
    <div className="mt-10">
      <h2 className="text-2xl font-bold mb-6">Senators</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {senators.map((senator) => {
          const id = senator.id || senator.bioguideId || "";
          const image = senator.image || senator.imageUrl || "/images/placeholder-avatar.svg";
          
          return (
            <Link
              key={id}
              href={`/senator/${id}`}
              className="group"
            >
              <div className="rounded-xl border bg-white shadow-sm hover:shadow-md transition overflow-hidden">
                <div className="relative h-44 w-full bg-gray-100">
                  <ClientImage
                    src={image}
                    alt={senator.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    fallbackSrc="/images/placeholder-avatar.svg"
                  />
                </div>
                <div className="p-4">
                  <div className="font-semibold text-lg group-hover:text-blue-600">
                    {senator.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {senator.state}
                  </div>
                  <div className="text-sm text-gray-500">
                    {senator.party || "—"}
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
