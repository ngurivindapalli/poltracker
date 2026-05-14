"use client"

import { useEffect, useState } from "react"
import { tweets } from "@/data/tweets"
import Image from "next/image"
import { FilteredNewsFeedSuspended } from "@/components/news/FilteredNewsFeed"

type Member = {
  id: string
  name: string
  party: string
  state: string
  image: string
}

type MemberProfileProps = {
  member: Member
}

export default function MemberProfile({ member }: MemberProfileProps) {
  const [bills, setBills] = useState<any[]>([])
  const [loadingBills, setLoadingBills] = useState(true)

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
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "3rem 2rem" }}>
      {/* Profile Header */}
      <div style={{
        display: "flex",
        gap: "2rem",
        alignItems: "center",
        marginBottom: "3rem"
      }}>
        <Image
          src={member.image || "/images/placeholder-avatar.svg"}
          alt={member.name}
          width={144}
          height={144}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            border: "2px solid #E5E7EB"
          }}
          onError={(e) => {
            e.currentTarget.src = "/images/placeholder-avatar.svg"
          }}
        />

        <div>
          <h1 style={{ fontSize: "2.5rem", marginBottom: "0.5rem", fontWeight: 700 }}>
            {member.name}
          </h1>
          <p style={{ color: "#6B7280", fontSize: "1.1rem", marginBottom: "1.5rem" }}>
            {member.party || '—'} • {member.state || '—'}
          </p>
        </div>
      </div>

      {/* Profile Section */}
      <div style={{
        background: "#FFFFFF",
        border: "1px solid #E5E7EB",
        borderRadius: "12px",
        padding: "1.5rem",
        boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
        marginBottom: "3rem"
      }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", fontWeight: 600 }}>
          Profile
        </h2>
        <p style={{ color: "#6B7280", lineHeight: 1.6 }}>
          Bundestag member representing {member.state}.
        </p>
      </div>

      {/* Sponsored Legislation */}
      <section style={{ marginBottom: "3rem" }}>
        <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", fontWeight: 600 }}>
          Sponsored Legislation
        </h2>
        {loadingBills ? (
          <div style={{ color: "#6B7280" }}>Loading bills...</div>
        ) : bills.length === 0 ? (
          <div style={{
            padding: "1.5rem",
            backgroundColor: "#F9FAFB",
            border: "1px solid #E5E7EB",
            borderRadius: "8px",
            color: "#6B7280"
          }}>
            No sponsored legislation data available.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
      </section>

      {/* Recent News */}
      <section style={{ marginBottom: "3rem" }}>
        <FilteredNewsFeedSuspended
          title="Recent News"
          buildApiUrl={(sp) =>
            `/api/news?q=${encodeURIComponent(
              member.name + " Germany"
            )}&sources=${encodeURIComponent(sp)}`
          }
          reloadDeps={[member.name]}
        />
      </section>

      {/* Recent Tweets */}
      {tweets[member.name] && (
        <section>
          <h2 style={{ fontSize: "1.6rem", marginBottom: "1rem", fontWeight: 600 }}>
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
        </section>
      )}
    </div>
  )
}
