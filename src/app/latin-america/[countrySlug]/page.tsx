import { notFound } from "next/navigation"
import Link from "next/link"
import { LATIN_AMERICA_COUNTRIES } from "@/data/latinAmericaCountries"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { InternationalNewsFeed } from "@/components/international/InternationalNewsFeed"
import { CommentSection } from "@/components/comments/CommentSection"

interface Props {
  params: { countrySlug: string }
}

export async function generateStaticParams() {
  return LATIN_AMERICA_COUNTRIES.map((c) => ({ countrySlug: c.slug }))
}

export async function generateMetadata({ params }: Props) {
  const country = LATIN_AMERICA_COUNTRIES.find((c) => c.slug === params.countrySlug)
  if (!country) return {}
  return {
    title: `${country.countryName} Politics | Politeia`,
    description: `Political overview, leaders, parties, and news for ${country.countryName}.`,
  }
}

export default function LatinAmericaCountryPage({ params }: Props) {
  const country = LATIN_AMERICA_COUNTRIES.find((c) => c.slug === params.countrySlug)
  if (!country) notFound()

  return (
    <div className="section space-y-10">
      <div className="flex items-start gap-4 pb-6 border-b border-border">
        <span className="text-5xl" aria-hidden="true">{country.flag}</span>
        <div>
          <Link href="/latin-america" className="text-[13px] text-muted-foreground hover:text-foreground mb-1 block">
            Latin America /
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{country.countryName}</h1>
          <p className="text-muted-foreground mt-1">
            {country.capital} &bull; {country.region}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Overview</h2>
          <div className="space-y-3">
            {[
              ["Government Type", country.governmentType],
              ["Leader", country.presidentOrLeader],
              ["Capital", country.capital],
              ["Legislature", country.legislatureName],
              ...(country.nextElection ? [["Next Election", country.nextElection]] : []),
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between items-start gap-3">
                <span className="text-[13px] text-muted-foreground shrink-0">{label}</span>
                <span className="text-[13px] font-semibold text-foreground text-right">{value}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <a
              href={country.officialGovernmentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] font-medium text-primary hover:underline"
            >
              Official Government Website
            </a>
          </div>
        </Card>

        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Major Parties</h2>
          <div className="flex flex-wrap gap-2">
            {country.majorParties.map((p) => (
              <Badge key={p} variant="default">{p}</Badge>
            ))}
          </div>
        </Card>
      </div>

      <div className="border-t border-border pt-8">
        <InternationalNewsFeed
          query={country.newsQuery}
          title={`${country.countryName} News`}
        />
      </div>

      <div className="border-t border-border pt-8">
        <CommentSection entityType="latin-america-country" entityId={country.slug} />
      </div>
    </div>
  )
}
