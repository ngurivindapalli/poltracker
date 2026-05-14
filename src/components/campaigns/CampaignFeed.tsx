"use client"

import { useState, useMemo } from "react"
import { CAMPAIGNS, Campaign, CampaignStatus } from "@/data/campaigns"
import { CampaignCard } from "./CampaignCard"

const ALL_COUNTRIES = Array.from(new Set(CAMPAIGNS.map((c) => c.country))).sort()
const ALL_OFFICES = Array.from(new Set(CAMPAIGNS.map((c) => c.office))).sort()

export function CampaignFeed() {
  const [search, setSearch] = useState("")
  const [country, setCountry] = useState<string>("all")
  const [office, setOffice] = useState<string>("all")
  const [status, setStatus] = useState<string>("all")

  const filtered = useMemo(() => {
    return CAMPAIGNS.filter((c: Campaign) => {
      const matchSearch =
        !search ||
        c.candidateName.toLowerCase().includes(search.toLowerCase()) ||
        c.party.toLowerCase().includes(search.toLowerCase())
      const matchCountry = country === "all" || c.country === country
      const matchOffice = office === "all" || c.office === office
      const matchStatus = status === "all" || c.campaignStatus === status
      return matchSearch && matchCountry && matchOffice && matchStatus
    })
  }, [search, country, office, status])

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by candidate or party..."
          className="col-span-1 sm:col-span-2 lg:col-span-2 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Countries</option>
          {ALL_COUNTRIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="all">All Offices</option>
          {ALL_OFFICES.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["all", "active", "exploratory", "suspended", "ended"] as (string | CampaignStatus)[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              status === s
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {s === "all" ? "All Status" : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No campaigns match your current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((c) => (
            <CampaignCard key={c.id} campaign={c} />
          ))}
        </div>
      )}
    </div>
  )
}
