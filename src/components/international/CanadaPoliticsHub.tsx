import { CANADA_FEDERAL, CANADA_PARTIES, CANADA_PROVINCES } from "@/data/canadaPolitics"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

export function CanadaPoliticsHub() {
  const provinces = CANADA_PROVINCES.filter((p) => p.type === "province")
  const territories = CANADA_PROVINCES.filter((p) => p.type === "territory")

  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Federal Government</h2>
          <div className="space-y-3">
            {[
              ["Government Type", CANADA_FEDERAL.governmentType],
              ["Prime Minister", CANADA_FEDERAL.primeMinister],
              ["Governor General", CANADA_FEDERAL.governorGeneral],
              ["Parliament", CANADA_FEDERAL.parliamentName],
              ["Last Election", CANADA_FEDERAL.lastElection],
              ["Next Election", CANADA_FEDERAL.nextElection],
              ["Election System", CANADA_FEDERAL.electionSystem],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-3">
                <span className="text-[13px] text-muted-foreground shrink-0">{label}</span>
                <span className="text-[13px] font-semibold text-foreground text-right">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <a
              href={CANADA_FEDERAL.governmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              canada.ca
            </a>
          </div>
        </Card>

        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Major Parties</h2>
          <div className="space-y-4">
            {CANADA_PARTIES.map((party) => (
              <div key={party.abbreviation} className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[14px] font-semibold text-foreground">{party.abbreviation}</p>
                  <p className="text-[12px] text-muted-foreground">{party.name}</p>
                  <p className="text-[11px] text-muted-foreground">{party.ideology}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[13px] text-muted-foreground">{party.leader}</p>
                  {party.seats !== undefined && (
                    <Badge variant="neutral" className="text-[10px] mt-1">
                      {party.seats} seats
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Provinces</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {provinces.map((province) => (
            <Card key={province.slug} className="p-4">
              <h3 className="text-[15px] font-bold text-foreground mb-2">{province.name}</h3>
              <p className="text-[12px] text-muted-foreground mb-2">Capital: {province.capital}</p>
              {province.premier && (
                <p className="text-[13px] text-foreground">
                  Premier: <span className="font-semibold">{province.premier}</span>
                </p>
              )}
              {province.governingParty && (
                <Badge variant="default" className="mt-2 text-[11px]">
                  {province.governingParty}
                </Badge>
              )}
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-xl font-bold text-foreground mb-4">Territories</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {territories.map((territory) => (
            <Card key={territory.slug} className="p-4">
              <h3 className="text-[15px] font-bold text-foreground mb-2">{territory.name}</h3>
              <p className="text-[12px] text-muted-foreground">Capital: {territory.capital}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
