"use client"

import { useRouter } from "next/navigation"

const states = [
  "Baden-Wurttemberg",
  "Bavaria",
  "Berlin",
  "Brandenburg",
  "Bremen",
  "Hamburg",
  "Hesse",
  "Lower Saxony",
  "Mecklenburg-Vorpommern",
  "North Rhine-Westphalia",
  "Rhineland-Palatinate",
  "Saarland",
  "Saxony",
  "Saxony-Anhalt",
  "Schleswig-Holstein",
  "Thuringia"
]

export default function GermanyMap() {
  const router = useRouter()

  return (
    <div className="mb-10">
      <h2 className="text-xl font-semibold mb-4">
        Explore by State
      </h2>

      <div className="grid grid-cols-4 gap-3">
        {states.map(state => (
          <button
            key={state}
            onClick={() =>
              router.push(`/germany/state/${state}`)
            }
            className="
              bg-white
              border
              rounded-xl
              p-3
              hover:shadow-md
              transition
            "
          >
            {state}
          </button>
        ))}
      </div>
    </div>
  )
}
