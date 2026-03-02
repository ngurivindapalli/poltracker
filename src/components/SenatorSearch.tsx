"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

type Senator = {
  bioguideId: string
  name: string
  party?: string
  state?: string
}

export default function SenatorSearch() {
  const [query, setQuery] = useState("")
  const [senators, setSenators] = useState<Senator[]>([])
  const [loading, setLoading] = useState(false)

  // Load senators once on mount for search
  useEffect(() => {
    const fetchAllSenators = async () => {
      try {
        const res = await fetch('/api/senators')
        if (res.ok) {
          const data = await res.json()
          setSenators(data.senators || [])
        }
      } catch (err) {
        console.error('Error fetching senators:', err)
      }
    }
    fetchAllSenators()
  }, [])

  // Load senators once on mount for search
  useEffect(() => {
    const fetchAllSenators = async () => {
      try {
        const res = await fetch('/api/senators')
        if (res.ok) {
          const data = await res.json()
          setSenators(data.senators || [])
        }
      } catch (err) {
        console.error('Error fetching senators:', err)
      }
    }
    fetchAllSenators()
  }, [])

  const filtered = query.length >= 2
    ? senators.filter((s) =>
        s.name.toLowerCase().includes(query.toLowerCase()) ||
        (s.state || '').toLowerCase().includes(query.toLowerCase()) ||
        (s.party || '').toLowerCase().includes(query.toLowerCase())
      ).slice(0, 10)
    : []

  return (
    <div style={{ marginBottom: "3rem" }}>
      <input
        type="text"
        placeholder="Search for a senator by name, state, or party..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{
          width: "100%",
          padding: "0.75rem 1rem",
          fontSize: "1rem",
          borderRadius: "8px",
          border: "1px solid #D1D5DB",
          outline: "none"
        }}
        onFocus={(e) => {
          e.target.style.borderColor = "#2563EB"
        }}
        onBlur={(e) => {
          e.target.style.borderColor = "#D1D5DB"
        }}
      />

      {query.length >= 2 && filtered.length > 0 && (
        <div
          style={{
            marginTop: "0.5rem",
            background: "#FFFFFF",
            borderRadius: "8px",
            boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            border: "1px solid #E5E7EB",
            maxHeight: "400px",
            overflowY: "auto"
          }}
        >
          {filtered.map((s) => (
            <Link
              key={s.bioguideId}
              href={`/senator/${s.bioguideId}`}
              style={{
                display: "block",
                padding: "0.75rem 1rem",
                borderBottom: "1px solid #E5E7EB",
                textDecoration: "none",
                color: "#111827"
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#F9FAFB"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent"
              }}
            >
              <div style={{ fontWeight: 500 }}>{s.name}</div>
              <div style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "0.25rem" }}>
                {s.party || '—'} • {s.state || '—'}
              </div>
            </Link>
          ))}
        </div>
      )}

      {query.length >= 2 && filtered.length === 0 && !loading && (
        <div style={{ 
          marginTop: "0.5rem", 
          padding: "1rem", 
          color: "#6B7280", 
          fontSize: "0.9rem",
          textAlign: "center"
        }}>
          No senators found matching &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
