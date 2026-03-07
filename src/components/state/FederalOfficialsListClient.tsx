"use client"

import { useEffect, useState } from "react"

type FederalOfficialsListClientProps = {
  stateCode: string
}

export default function FederalOfficialsListClient({ stateCode }: FederalOfficialsListClientProps) {
  const [senators, setSenators] = useState<any[]>([])
  const [reps, setReps] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const senRes = await fetch("/api/senators")
        const senData = await senRes.json()

        const repRes = await fetch("/api/representatives")
        const repData = await repRes.json()

        const stateSenators = (senData.senators || []).filter(
          (s: any) => s.state === stateCode.toUpperCase()
        )

        const stateReps = (repData.representatives || [])
          .filter((r: any) => r.state === stateCode.toUpperCase())
          .sort((a: any, b: any) => {
            const distA = typeof a.district === "number" ? a.district : parseInt(a.district) || 999
            const distB = typeof b.district === "number" ? b.district : parseInt(b.district) || 999
            return distA - distB
          })
          .slice(0, 3)

        setSenators(stateSenators)
        setReps(stateReps)
      } catch (err) {
        console.error("Error loading federal officials:", err)
      }
    }

    load()
  }, [stateCode])

  if (senators.length === 0 && reps.length === 0) {
    return null
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4 text-[#1E3A5F]">
        Federal Officials
      </h2>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h3 className="font-medium mb-2 text-[#64748B]">
            U.S. Senators
          </h3>
          {senators.map((s: any) => (
            <a
              key={s.bioguideId}
              href={`/senator/${s.bioguideId}`}
              className="block border border-[#E2E8F0] p-3 rounded hover:shadow transition-all mb-2"
            >
              {s.name}
            </a>
          ))}
        </div>

        <div>
          <h3 className="font-medium mb-2 text-[#64748B]">
            House Representatives
          </h3>
          {reps.map((r: any) => (
            <a
              key={r.bioguideId}
              href={`/representatives/${r.bioguideId}`}
              className="block border border-[#E2E8F0] p-3 rounded hover:shadow transition-all mb-2"
            >
              {r.name} {r.district ? `(District ${r.district})` : ""}
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}
