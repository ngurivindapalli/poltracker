import Link from "next/link";
import NewsFeedWithQuery from "@/components/news/NewsFeedWithQuery";
import { CMS } from "@/lib/chiefMinisters";
import { indiaSlugToState } from "@/lib/geo/india-states";
import LeaderImage from "@/components/LeaderImage";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";

export default function StatePage({ params }: { params: { state: string } }) {
  const stateName = indiaSlugToState(params.state) || decodeURIComponent(params.state);
  const cm = CMS[stateName as keyof typeof CMS];

  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
      <Link
        href="/india"
        className="inline-flex items-center text-[#64748B] hover:text-[#1E3A5F] mb-8 font-medium transition-colors"
      >
        <svg
          className="w-4 h-4 mr-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 19l-7-7m0 0l7-7m-7 7h18"
          />
        </svg>
        Back to India
      </Link>

      <PageHeader
        title={stateName}
        subtitle="State Government & Political News"
      />

      {/* CM Profile */}
      <Card className="mb-12 p-8 flex flex-col md:flex-row items-center gap-8">
        <LeaderImage
          src="/default-avatar.svg"
          name="Chief Minister"
          size="w-32 h-32"
        />

        <div className="text-center md:text-left">
          <div className="text-[14px] font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            Chief Minister
          </div>
          {cm ? (
            <>
              <h2 className="text-[28px] font-bold text-[#1E3A5F] mb-2">
                {cm.name}
              </h2>
              <p className="text-[16px] text-[#64748B]">
                {cm.party}
              </p>
            </>
          ) : (
            <p className="text-[16px] text-[#94A3B8] italic">
              Data Coming Soon
            </p>
          )}
        </div>
      </Card>

      {/* News Section */}
      <Section title="Recent News" subtitle={`Latest political news from ${stateName}`}>
        <NewsFeedWithQuery query={`${stateName} India politics`} />
      </Section>
    </main>
  );
}
