"use client"

import Image from "next/image"
import { useEffect, useState } from "react"
import { tweets } from "@/data/tweets"
import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

type Member = {
  id: string
  name: string
  party: string
  state: string
  image: string
  profileUrl?: string
  bio?: string
}

type GermanyProfileLayoutProps = {
  member: Member
}

export default function GermanyProfileLayout({ member }: GermanyProfileLayoutProps) {
  const [bills, setBills] = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(true)

  const partyColors: Record<string, string> = {
    SPD: "#e3000f",
    CDU: "#000000",
    CSU: "#0066cc",
    FDP: "#ffed00",
    Greens: "#1aa037",
    AfD: "#009ee0",
    Left: "#be3075"
  }

  const color = partyColors[member.party] || "#333"

  useEffect(() => {
    async function loadBills() {
      try {
        const res = await fetch(`/api/germany/member/${member.id}/sponsored-bills`)
        if (res.ok) {
          const data = await res.json()
          setBills(data.bills || [])
        }
      } catch (err) {
        console.error('Error loading bills:', err)
      } finally {
        setLoadingBills(false)
      }
    }
    loadBills()
  }, [member.id])

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
      {/* HEADER */}
      <div style={{
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        marginBottom: "2.5rem"
      }}>
        <div style={{
          position: "relative",
          width: "144px",
          height: "144px",
          borderRadius: "50%",
          overflow: "hidden",
          border: `4px solid ${color}`
        }}>
          <Image
            src={member.image || "/images/placeholder-avatar.svg"}
            alt={member.name}
            fill
            className="object-cover"
            onError={(e) => {
              e.currentTarget.src = "/images/placeholder-avatar.svg"
            }}
          />
        </div>

        <div>
          <h1 style={{
            fontSize: "3rem",
            fontWeight: 700,
            marginBottom: "0.5rem",
            letterSpacing: "-0.02em"
          }}>
            {member.name}
          </h1>
          <div style={{
            fontSize: "1.25rem",
            color: "#6B7280"
          }}>
            {member.party}
            {" • "}
            {member.state}
          </div>
        </div>
      </div>

      {/* INFO CARDS */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: "1.5rem",
        marginBottom: "2.5rem"
      }}>
        <div style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem"
        }}>
          <div style={{
            fontSize: "0.875rem",
            color: "#6B7280",
            marginBottom: "0.5rem"
          }}>
            Bundestag Profile
          </div>
          {member.profileUrl ? (
            <a
              href={member.profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#2563EB",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              View on Bundestag →
            </a>
          ) : (
            <div style={{ color: "#9CA3AF" }}>Profile link unavailable</div>
          )}
        </div>

        <div style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem"
        }}>
          <div style={{
            fontSize: "0.875rem",
            color: "#6B7280",
            marginBottom: "0.5rem"
          }}>
            Party
          </div>
          <div style={{
            fontWeight: 600,
            color: color
          }}>
            {member.party}
          </div>
        </div>
      </div>

      {/* BIO */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        padding: "1.5rem",
        marginBottom: "2.5rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          Biography
        </h2>
        <p style={{
          color: "#374151",
          lineHeight: 1.7
        }}>
          {member.bio || `Bundestag member representing ${member.state}.`}
        </p>
      </div>

      {/* SPONSORED LEGISLATION */}
      {bills.length > 0 && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem",
          marginBottom: "2.5rem"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1rem"
          }}>
            Sponsored Legislation
          </h2>
          {loadingBills ? (
            <div style={{ color: "#6B7280" }}>Loading bills...</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {bills.map((bill, i) => (
                <a
                  key={i}
                  href={bill.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    border: "1px solid #E5E7EB",
                    padding: "1rem",
                    borderRadius: "8px",
                    background: "#FFFFFF",
                    textDecoration: "none",
                    color: "inherit",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.1)"
                    e.currentTarget.style.transform = "translateY(-1px)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "none"
                    e.currentTarget.style.transform = "translateY(0)"
                  }}
                >
                  <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>
                    {bill.title}
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "#6B7280", marginBottom: "0.25rem" }}>
                    {bill.number}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>
                    {bill.status} • {bill.introducedDate ? new Date(bill.introducedDate).toLocaleDateString() : ""}
                  </div>
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* COMMITTEES */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        padding: "1.5rem",
        marginBottom: "2.5rem"
      }}>
        <h2 style={{
          fontSize: "1.5rem",
          fontWeight: 600,
          marginBottom: "1rem"
        }}>
          Committees
        </h2>
        <div style={{ color: "#6B7280" }}>
          Committee data coming soon.
        </div>
      </div>

      {/* NEWS */}
      <div style={{
        background: "#FFFFFF",
        borderRadius: "12px",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        padding: "1.5rem",
        marginBottom: "2.5rem"
      }}>
        <FilteredNewsFeedSuspended
          title="Recent News"
          buildApiUrl={(sp) =>
            `/api/news?q=${encodeURIComponent(
              member.name + " Germany"
            )}&sources=${encodeURIComponent(sp)}`
          }
          reloadDeps={[member.name]}
        />
      </div>

      {/* RECENT TWEETS */}
      {tweets[member.name] && (
        <div style={{
          background: "#FFFFFF",
          borderRadius: "12px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
          padding: "1.5rem"
        }}>
          <h2 style={{
            fontSize: "1.5rem",
            fontWeight: 600,
            marginBottom: "1rem"
          }}>
            Recent Tweets
          </h2>
          {tweets[member.name].map((t, i) => (
            <div
              key={i}
              style={{
                background: "#f5f5f5",
                padding: 12,
                marginBottom: 10,
                borderRadius: 10
              }}
            >
              🐦 {t}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
