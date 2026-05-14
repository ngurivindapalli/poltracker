import Link from "next/link"
import { Card } from "@/components/ui/Card"
import { Badge } from "@/components/ui/Badge"

interface CountryPoliticsCardProps {
  flag: string
  countryName: string
  slug: string
  capital: string
  headOfGovernment: string
  governmentType: string
  groups?: string[]
  nextElection?: string
  basePath: string
}

export function CountryPoliticsCard({
  flag,
  countryName,
  slug,
  capital,
  headOfGovernment,
  governmentType,
  groups,
  nextElection,
  basePath,
}: CountryPoliticsCardProps) {
  return (
    <Link href={`${basePath}/${slug}`} className="block group">
      <Card className="h-full transition-all group-hover:border-primary/40 group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="flex items-start gap-3 mb-3">
          <span className="text-3xl" aria-hidden="true">{flag}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-[16px] font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
              {countryName}
            </h3>
            <p className="text-[12px] text-muted-foreground">{capital}</p>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold w-20 shrink-0">Leader</span>
            <span className="text-[13px] text-foreground truncate">{headOfGovernment}</span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold w-20 shrink-0">Gov Type</span>
            <span className="text-[13px] text-muted-foreground leading-tight line-clamp-2">{governmentType}</span>
          </div>
          {nextElection && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold w-20 shrink-0">Election</span>
              <span className="text-[13px] text-muted-foreground">{nextElection}</span>
            </div>
          )}
        </div>

        {groups && groups.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {groups.map((g) => (
              <Badge key={g} variant="neutral" className="text-[10px]">{g}</Badge>
            ))}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-[12px] font-medium text-primary">View Profile</span>
          <svg className="w-4 h-4 text-primary transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </Card>
    </Link>
  )
}
