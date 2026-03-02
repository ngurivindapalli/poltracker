"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import BackButton from "@/components/BackButton"

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

        console.log("Loading state:", stateName)

        const res = await fetch("/api/germany/members")
        const data = await res.json()

        console.log("Total members:", data.length)

        const filtered = data.filter((m: any) => {
          const memberState = m.state || ""
          return memberState === stateName || 
                 memberState.toLowerCase() === stateName.toLowerCase()
        })

        console.log("Filtered:", filtered.length)

        setMembers(filtered)
        setLoading(false)
      } catch (e) {
        console.error("Germany fetch error", e)
        setLoading(false)
      }
    }

    load()
  }, [params.state])

  if (loading) {
    return (
      <div className="container">
        <BackButton />
        <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
          Loading members...
        </div>
      </div>
    )
  }

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
    <div className="container">
      <BackButton />
      <div className="sectionHeader">
        <h2>{stateName}</h2>
        <p>Bundestag members from {stateName}.</p>
      </div>

      {members.length === 0 ? (
        <div style={{ padding: "2rem", textAlign: "center", color: "#6B7280" }}>
          No members found for {stateName}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6 mt-8" style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: "1.5rem"
        }}>
          {members.map((m: any) => (
            <a
              href={`/germany/member/${m.id}`}
              key={m.id}
              className="bg-white shadow rounded-xl p-6 flex gap-4 hover:shadow-lg transition"
              style={{
                textDecoration: "none",
                color: "inherit"
              }}
            >
              <div style={{
                position: "relative",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                overflow: "hidden",
                flexShrink: 0
              }}>
                <Image
                  src={m.image || "/images/placeholder-avatar.svg"}
                  alt={m.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div>
                <div style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  marginBottom: "0.25rem"
                }}>
                  {m.name}
                </div>
                <div style={{ color: "#6B7280" }}>
                  {m.party}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
