import { LandingHero } from "@/components/home/LandingHero";
import CspanSchedule from "@/components/home/CspanSchedule";
import USStateMap from "@/components/USStateMap";
import SenatorsList from "@/components/SenatorsList";
import LeaderCard from "@/components/LeaderCard";
import { Section } from "@/components/ui/Section";
import { GLOBAL_LEADERS } from "@/data/globalLeaders";
import { getSenatorSummaries } from "@/lib/senators/summaries";

export const revalidate = 600;

export default async function HomePage() {
  const { senators } = await getSenatorSummaries();

  return (
    <div className="pb-24">
      <LandingHero />

      <div className="max-w-[1300px] mx-auto px-6">
        <Section
          title="Explore By State"
          subtitle="Click on any state to view local representatives, news, and legislative updates."
        >
          <div className="panel flex justify-center overflow-hidden p-1">
            <USStateMap />
          </div>
        </Section>

        <Section
          title="Global Leadership"
          subtitle="Track key international political figures."
        >
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {GLOBAL_LEADERS.map((leader) => (
              <LeaderCard key={leader.slug} leader={leader} />
            ))}
          </div>
        </Section>

        <Section
          title="U.S. Senate"
          subtitle="Direct access to financial disclosures, voting records, and donor networks."
        >
          <SenatorsList senators={senators} limit={8} />

          <div className="mt-8 text-center">
            <a
              href="/senators"
              className="inline-flex items-center justify-center px-6 py-3 border border-border rounded-[8px] text-[14px] font-semibold text-foreground bg-card hover:bg-muted transition-colors"
            >
              View All Senators
            </a>
          </div>
        </Section>

        <CspanSchedule />
      </div>
    </div>
  );
}
