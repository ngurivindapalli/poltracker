"use client"

import { useState, useMemo } from "react"
import { LATIN_AMERICA_COUNTRIES } from "@/data/latinAmericaCountries"
import { CountryPoliticsCard } from "./CountryPoliticsCard"

const ALL_REGIONS = Array.from(
  new Set(LATIN_AMERICA_COUNTRIES.map((c) => c.region))
).sort()

export function LatinAmericaHub() {
  const [search, setSearch] = useState("")
  const [region, setRegion] = useState<string>("all")

  const filtered = useMemo(() => {
    return LATIN_AMERICA_COUNTRIES.filter((c) => {
      const matchSearch =
        !search || c.countryName.toLowerCase().includes(search.toLowerCase())
      const matchRegion = region === "all" || c.region === region
      return matchSearch && matchRegion
    })
  }, [search, region])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search countries..."
          className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
        />
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setRegion("all")}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
            region === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          All Regions
        </button>
        {ALL_REGIONS.map((r) => (
          <button
            key={r}
            onClick={() => setRegion(r)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              region === r
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground text-sm">
          No countries match your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((country) => (
            <CountryPoliticsCard
              key={country.slug}
              flag={country.flag}
              countryName={country.countryName}
              slug={country.slug}
              capital={country.capital}
              headOfGovernment={country.presidentOrLeader}
              governmentType={country.governmentType}
              nextElection={country.nextElection}
              basePath="/latin-america"
            />
          ))}
        </div>
      )}
    </div>
  )
}
