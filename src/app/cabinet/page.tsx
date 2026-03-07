import { getCabinetMembers } from "@/lib/cabinetData"
import Link from "next/link"

export default function CabinetPage() {
  const members = getCabinetMembers()

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-semibold mb-10">
        United States Cabinet
      </h1>

      <div className="grid grid-cols-3 gap-6">
        {members.map((m:any)=>(
          <Link
            key={m.id}
            href={`/cabinet/${m.id}`}
          >
            <div className="bg-white border rounded-xl p-5 shadow-sm hover:shadow-md cursor-pointer transition">
              <h2 className="text-lg font-semibold">
                {m.name}
              </h2>
              <p className="text-gray-600">
                {m.position}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  )
}
