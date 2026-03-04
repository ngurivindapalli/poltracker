import { LandingHero } from "@/components/home/LandingHero";
import CspanSchedule from "@/components/home/CspanSchedule";
import USStateMap from "@/components/USStateMap";
import SenatorsList from "@/components/SenatorsList";
import LeadersList from "@/components/home/LeadersList";
import { Section } from "@/components/ui/Section";
import { getBaseUrl } from "@/lib/baseUrl";
import leadersData from "@/data/global-leaders.json";

// Force dynamic rendering so senators are fetched at request time
export const dynamic = 'force-dynamic'

// Fetch Senators
async function getSenators() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/senators`, {
      cache: 'no-store',
    });
    if (!res.ok) {
      console.error("Failed to fetch senators - status:", res.status);
      return [];
    }
    const data = await res.json();
    console.log("Home page - Loaded Senators:", data.senators?.length || 0);
    return data.senators || [];
  } catch (e) {
    console.error("Failed to fetch senators", e);
    return [];
  }
}

// Transform JSON data to LeadersList format
const FEATURED_LEADERS = leadersData.map(leader => ({
  id: leader.id,
  name: leader.name,
  title: leader.title,
  country: leader.country,
  imageUrl: leader.image,
  link: `/leader/${leader.id}`,
}));

export default async function HomePage() {
  const senators = await getSenators();

  return (
    <div className="pb-24">
      <LandingHero />

      <div className="max-w-[1300px] mx-auto px-6">
        {/* Map Section */}
        <Section 
          title="Explore By State" 
          subtitle="Click on any state to view local representatives, news, and legislative updates."
        >
          <div className="bg-white border border-[#E2E8F0] rounded-[12px] p-1 overflow-hidden shadow-sm">
             <USStateMap />
          </div>
        </Section>

        {/* Global Leaders */}
        <Section
          title="Global Leadership"
          subtitle="Track key international political figures."
        >
          <LeadersList leaders={FEATURED_LEADERS} />
        </Section>

        {/* Senators Section */}
        <Section
          title="U.S. Senate"
          subtitle="Direct access to financial disclosures, voting records, and donor networks."
        >
          <SenatorsList senators={senators} limit={8} />
          
          <div className="mt-8 text-center">
            <a 
              href="/senators" 
              className="inline-flex items-center justify-center px-6 py-3 border border-[#E2E8F0] rounded-[8px] text-[14px] font-semibold text-[#1E3A5F] bg-white hover:bg-[#F8FAFC] transition-colors"
            >
              View All Senators
            </a>
          </div>
        </Section>

        {/* C-SPAN Schedule */}
        <CspanSchedule />
      </div>
    </div>
  );
}
