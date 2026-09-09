import { LandingHero } from "@/components/home/LandingHero";
import { LatestLegislation } from "@/components/home/LatestLegislation";
import CspanSchedule from "@/components/home/CspanSchedule";
import USStateMap from "@/components/USStateMap";
import { Section } from "@/components/ui/Section";
import { getStatePartyControl } from "@/lib/states/partyControl";
import Link from "next/link";

export const revalidate = 600;

export default function HomePage() {
  const controlByState = getStatePartyControl();

  return (
    <div className="pb-16">
      <LandingHero />

      <Section
        title="Explore U.S. politics"
        subtitle="Select a state for senators, representatives, and local coverage. Colors reflect Senate delegation from synchronized member data."
      >
        <div className="panel">
          <USStateMap controlByState={controlByState} />
        </div>
      </Section>

      <LatestLegislation />

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
