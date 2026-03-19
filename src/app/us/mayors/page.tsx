import { MAYORS } from "@/data/mayors";
import { getMayorImage } from "@/lib/getMayorImage";
import Link from "next/link";

export default function MayorsPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8">
        Major US City Mayors
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {MAYORS.map((m) => (
          <Link key={m.slug} href={`/us/mayors/${m.slug}`}>
            <div className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition">
              <img
                src={getMayorImage(m.name)}
                alt={m.name}
                className="w-full h-40 object-cover rounded mb-3"
              />

              <h2 className="font-semibold">{m.name}</h2>
              <p className="text-gray-500">
                Mayor of {m.city}, {m.state}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
