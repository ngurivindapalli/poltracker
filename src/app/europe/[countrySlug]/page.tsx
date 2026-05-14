import { notFound } from "next/navigation"
import Link from "next/link"
import { EUROPE_COUNTRIES } from "@/data/europeCountries"
import { Badge } from "@/components/ui/Badge"
import { Card } from "@/components/ui/Card"
import { InternationalNewsFeed } from "@/components/international/InternationalNewsFeed"
import { CommentSection } from "@/components/comments/CommentSection"

interface Props {
  params: { countrySlug: string }
}

export async function generateStaticParams() {
  return EUROPE_COUNTRIES.map((c) => ({ countrySlug: c.slug }))
}

export async function generateMetadata({ params }: Props) {
  const country = EUROPE_COUNTRIES.find((c) => c.slug === params.countrySlug)
  if (!country) return {}
  return {
    title: `${country.countryName} Politics | Politeia`,
    description: `Political overview, leaders, parties, and news for ${country.countryName}.`,
  }
}

export default function EuropeCountryPage({ params }: Props) {
  const country = EUROPE_COUNTRIES.find((c) => c.slug === params.countrySlug)
  if (!country) notFound()

  return (
    <div className="section space-y-10">
      <div className="flex items-start gap-4 pb-6 border-b border-border">
        <span className="text-5xl" aria-hidden="true">{country.flag}</span>
        <div>
          <Link href="/europe" className="text-[13px] text-muted-foreground hover:text-foreground mb-1 block">
            Europe /
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{country.countryName}</h1>
          <p className="text-muted-foreground mt-1">{country.capital} &bull; {country.governmentType}</p>
          <div className="flex gap-2 mt-2 flex-wrap">
            {country.groups.map((g) => (
              <Badge key={g} variant="neutral">{g}</Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Leadership</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-3">
              <span className="text-[13px] text-muted-foreground">Head of Government</span>
              <span className="text-[14px] font-semibold text-foreground text-right">{country.headOfGovernment}</span>
            </div>
            {country.headOfState && (
              <div className="flex justify-between items-start gap-3">
                <span className="text-[13px] text-muted-foreground">Head of State</span>
                <span className="text-[14px] font-semibold text-foreground text-right">{country.headOfState}</span>
              </div>
            )}
          </div>
        </Card>

        <Card>
          <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Legislature</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-start gap-3">
              <span className="text-[13px] text-muted-foreground">Legislature</span>
              <span className="text-[14px] font-semibold text-foreground text-right">{country.legislatureName}</span>
            </div>
            <div className="flex justify-between items-start gap-3">
              <span className="text-[13px] text-muted-foreground">Election System</span>
              <span className="text-[14px] font-semibold text-foreground text-right">{country.electionSystem}</span>
            </div>
            {country.nextElection && (
              <div className="flex justify-between items-start gap-3">
                <span className="text-[13px] text-muted-foreground">Next Election</span>
                <span className="text-[14px] font-semibold text-foreground text-right">{country.nextElection}</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card>
        <h2 className="text-[13px] font-semibold text-muted-foreground uppercase tracking-wide mb-4">Major Parties</h2>
        <div className="flex flex-wrap gap-2">
          {country.majorParties.map((p) => (
            <Badge key={p} variant="default">{p}</Badge>
          ))}
        </div>
      </Card>

      <div className="flex justify-start">
        <a
          href={country.officialGovernmentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[13px] font-medium text-primary hover:underline"
        >
          Official Government Website
        </a>
      </div>

      <div className="border-t border-border pt-8">
        <InternationalNewsFeed query={country.newsQuery} title={`${country.countryName} News`} />
      </div>

      <div className="border-t border-border pt-8">
        <CommentSection entityType="europe-country" entityId={country.slug} />
      </div>
    </div>
  )
}
