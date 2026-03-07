import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"
import SenatorImage from "@/components/SenatorImage"
import { getSenatorsByState, getRepresentativesByState } from "@/lib/legislators"
import FederalOfficialsListClient from "./FederalOfficialsListClient"

type FederalOfficialsListProps = {
  stateCode: string
}

export default function FederalOfficialsList({ stateCode }: FederalOfficialsListProps) {
  // Try to get data from static file first
  const senators = getSenatorsByState(stateCode.toUpperCase()).slice(0, 2)
  const representatives = getRepresentativesByState(stateCode.toUpperCase()).slice(0, 3)

  // If we have data from static file, render it
  if (senators.length > 0 || representatives.length > 0) {
    return (
      <div className="mt-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#1E3A5F] mb-2">Federal Officials</h2>
          <p className="text-[#64748B] text-sm">
            U.S. Senators and House Representatives representing this state
          </p>
        </div>

        {senators.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1E3A5F]">
                U.S. Senators
              </h3>
              <Badge variant="neutral" className="text-xs">
                {senators.length} {senators.length === 1 ? "Senator" : "Senators"}
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {senators.map(s => {
                const bioguideId = s.id.bioguide
                return (
                  <Link
                    key={bioguideId}
                    href={`/senator/${bioguideId}`}
                    className="block group"
                  >
                    <Card className="p-5 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-lg transition-all duration-200 h-full">
                      <div className="flex gap-4 items-start">
                        <div className="flex-shrink-0">
                          <SenatorImage
                            bioguideId={bioguideId}
                            imageUrl={`https://unitedstates.github.io/images/congress/225x275/${bioguideId}.jpg`}
                            name={s.name.official_full}
                            width={80}
                            height={80}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          <div className="text-[16px] font-semibold text-[#1E3A5F] leading-tight mb-1 group-hover:text-[#2563EB] transition-colors">
                            {s.name.official_full}
                          </div>
                          <div className="text-[13px] text-[#64748B] mt-1">
                            U.S. Senator
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}

        {representatives.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[#1E3A5F]">
                House Representatives
              </h3>
              <Badge variant="neutral" className="text-xs">
                Top 3 by District
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {representatives.map(r => {
                const bioguideId = r.id.bioguide
                const district = r.terms.find(t => t.type === "rep")?.district
                return (
                  <Link
                    key={bioguideId}
                    href={`/representatives/${bioguideId}`}
                    className="block group"
                  >
                    <Card className="p-5 bg-white border border-[#E2E8F0] hover:border-[#2563EB] hover:shadow-lg transition-all duration-200 h-full">
                      <div className="flex flex-col">
                        <div className="flex-shrink-0 mb-3">
                          <SenatorImage
                            bioguideId={bioguideId}
                            imageUrl={`https://unitedstates.github.io/images/congress/225x275/${bioguideId}.jpg`}
                            name={r.name.official_full}
                            width={60}
                            height={60}
                          />
                        </div>
                        <div className="flex-grow min-w-0">
                          {district && (
                            <div className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wide mb-1">
                              District {district}
                            </div>
                          )}
                          <div className="text-[15px] font-semibold text-[#1E3A5F] leading-tight mb-1 group-hover:text-[#2563EB] transition-colors">
                            {r.name.official_full}
                          </div>
                          <div className="text-[12px] text-[#64748B]">
                            U.S. Representative
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Fallback to client component that uses API
  return <FederalOfficialsListClient stateCode={stateCode} />
}
