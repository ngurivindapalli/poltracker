"use client"

import { useState, useMemo } from "react"
import { EUROPE_COUNTRIES, EuropeGroup } from "@/data/europeCountries"
import { CountryPoliticsCard } from "./CountryPoliticsCard"

const GROUPS: EuropeGroup[] = ["EU", "Non-EU", "NATO", "G7"]

export function EuropePoliticsHub() {
  const [search, setSearch] = useState("")
  const [group, setGroup] = useState<EuropeGroup | "all">("all")

  const filtered = useMemo(() => {
    return EUROPE_COUNTRIES.filter((c) => {
      const matchSearch =
        !search || c.countryName.toLowerCase().includes(search.toLowerCase())
      const matchGroup = group === "all" || c.groups.includes(group)
      return matchSearch && matchGroup
    })
  }, [search, group])

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
          onClick={() => setGroup("all")}
          className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
            group === "all"
              ? "bg-primary text-primary-foreground border-primary"
              : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
          }`}
        >
          All
        </button>
        {GROUPS.map((g) => (
          <button
            key={g}
            onClick={() => setGroup(g)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium border transition-colors ${
              group === g
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/30"
            }`}
          >
            {g}
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
              headOfGovernment={country.headOfGovernment}
              governmentType={country.governmentType}
              groups={country.groups}
              nextElection={country.nextElection}
              basePath="/europe"
            />
          ))}
        </div>
      )}
    </div>
  )
}
