import { LandingHero } from "@/components/home/LandingHero";
import CspanSchedule from "@/components/home/CspanSchedule";
import USStateMap from "@/components/USStateMap";
import SenatorsList from "@/components/SenatorsList";
import LeaderCard from "@/components/LeaderCard";
import { PoliticalPulse } from "@/components/home/PoliticalPulse";
import { Section } from "@/components/ui/Section";
import { GLOBAL_LEADERS } from "@/data/globalLeaders";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import Link from "next/link";
import { relativeTime } from "@/lib/format";

export const revalidate = 600;

export default async function HomePage() {
  const { senators, dataUpdatedAt } = await getSenatorSummaries();
  const updated = relativeTime(dataUpdatedAt);

  return (
    <div className="pb-16">
      <LandingHero />

      <Section
        title="Political pulse"
        subtitle="Summaries from synchronized public financial disclosures. Not live market data."
      >
        {updated ? (
          <p className="mb-6 text-sm text-muted-foreground">{updated}</p>
        ) : null}
        <PoliticalPulse senators={senators} />
      </Section>

      <Section
        title="Explore U.S. politics"
        subtitle="Select a state for senators, representatives, and local coverage."
      >
        <div className="panel">
          <USStateMap />
        </div>
      </Section>

      <Section
        title="U.S. Senate"
        subtitle="Estimated net worth and disclosed trading activity from synchronized Quiver data."
      >
        <SenatorsList senators={senators} limit={8} />
        <div className="mt-8 text-center">
          <Link
            href="/senators"
            className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            View all senators
          </Link>
        </div>
      </Section>

      <Section
        title="Global leadership"
        subtitle="Leaders from the UK, Germany, India, and beyond."
      >
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {GLOBAL_LEADERS.map((leader) => (
            <LeaderCard key={leader.slug} leader={leader} />
          ))}
        </div>
      </Section>

      <div className="mx-auto max-w-[1200px] px-4 sm:px-6">
        <CspanSchedule />
      </div>

      <Section
        title="Ask Politeia"
        subtitle="Ask about politicians, legislation, and policy. Answers link back to Politeia and public sources."
      >
        <Link
          href="/chat"
          className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Ask Politeia
        </Link>
      </Section>
    </div>
  );
}
