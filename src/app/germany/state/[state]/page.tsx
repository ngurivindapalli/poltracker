"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import BackButton from "@/components/BackButton"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

// Generate initials from name for fallback
function getInitials(name: string): string {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Party color mapping
function getPartyColor(party: string): string {
  const colors: Record<string, string> = {
    "SPD": "#E3000F",
    "CDU": "#000000",
    "CSU": "#0080C8",
    "Greens": "#46962B",
    "FDP": "#FFED00",
    "AfD": "#009EE0",
    "Left": "#BE3075",
  };
  return colors[party] || "#64748B";
}

function MemberImage({ src, name }: { src?: string; name: string }) {
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1E3A5F] to-[#2563EB] flex items-center justify-center border-2 border-[#E2E8F0] flex-shrink-0">
        <span className="text-white font-bold text-sm">
          {getInitials(name)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      onError={() => setError(true)}
      alt={name}
      className="w-16 h-16 rounded-full object-cover border-2 border-[#E2E8F0] flex-shrink-0"
    />
  );
}

export default function GermanyState({ params }: { params: { state: string } }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const stateSlug = decodeURIComponent(params.state)
        
        // Map common slug variations to actual state names
        const stateNameMap: Record<string, string> = {
          "baden-wurttemberg": "Baden-Württemberg",
          "baden-württemberg": "Baden-Württemberg",
          "lower-saxony": "Lower Saxony",
          "north-rhine-westphalia": "North Rhine-Westphalia",
          "rhineland-palatinate": "Rhineland-Palatinate",
          "saxony-anhalt": "Saxony-Anhalt",
          "schleswig-holstein": "Schleswig-Holstein",
          "mecklenburg-vorpommern": "Mecklenburg-Vorpommern"
        }

        let stateName = stateNameMap[stateSlug.toLowerCase()]
        if (!stateName) {
          // Fallback: capitalize words
          stateName = stateSlug
            .split("-")
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(" ")
        }

        const { getBaseUrl } = await import('@/lib/getBaseUrl')
        const base = getBaseUrl()
        const res = await fetch(`${base}/api/germany/members`)
        const data = await res.json()

        const filtered = data.filter((m: any) => {
          const memberState = m.state || ""
          return memberState === stateName || 
                 memberState.toLowerCase() === stateName.toLowerCase()
        })

        setMembers(filtered)
        setLoading(false)
      } catch (e) {
        console.error("Germany fetch error", e)
        setLoading(false)
      }
    }

    load()
  }, [params.state])

  const stateSlug = decodeURIComponent(params.state)
  const stateNameMap: Record<string, string> = {
    "baden-wurttemberg": "Baden-Württemberg",
    "baden-württemberg": "Baden-Württemberg",
    "lower-saxony": "Lower Saxony",
    "north-rhine-westphalia": "North Rhine-Westphalia",
    "rhineland-palatinate": "Rhineland-Palatinate",
    "saxony-anhalt": "Saxony-Anhalt",
    "schleswig-holstein": "Schleswig-Holstein",
    "mecklenburg-vorpommern": "Mecklenburg-Vorpommern"
  }
  const stateName = stateNameMap[stateSlug.toLowerCase()] || stateSlug
    .split("-")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">
      <Link href="/germany" className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors">
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Germany
      </Link>

      <div className="mb-10">
        <h1 className="text-[32px] font-bold text-[#1E3A5F] mb-2">{stateName}</h1>
        <p className="text-[16px] text-[#64748B]">Bundestag members from {stateName}.</p>
      </div>

      {loading ? (
        <div className="text-center py-12 text-[#64748B]">Loading members...</div>
      ) : members.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-[#64748B]">No members found for {stateName}</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {members.map((m: any) => (
            <Link
              href={`/germany/member/${m.id}`}
              key={m.id}
              className="block group"
            >
              <Card className="p-6 flex items-center gap-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:shadow-lg">
                <MemberImage src={m.image} name={m.name} />
                
                <div className="flex-grow min-w-0">
                  <h3 className="text-[18px] font-semibold text-[#1E3A5F] mb-1 group-hover:text-[#2563EB] transition-colors truncate">
                    {m.name}
                  </h3>
                  <Badge 
                    variant="neutral"
                    style={{ 
                      backgroundColor: `${getPartyColor(m.party)}15`,
                      color: getPartyColor(m.party),
                      borderColor: getPartyColor(m.party)
                    }}
                  >
                    {m.party}
                  </Badge>
                </div>

                <svg className="w-5 h-5 text-[#94A3B8] group-hover:text-[#2563EB] transition-colors flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
