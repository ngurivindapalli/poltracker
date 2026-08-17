import { PageHeader } from "@/components/ui/PageHeader";
import SenatorsList from "@/components/SenatorsList";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import { SourceBadge } from "@/components/data/SourceBadge";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "Investments",
  description:
    "Congressional trading summaries from synchronized public disclosures. Estimates and reported transactions are labeled as such.",
};

export default async function InvestmentsPage() {
  const { senators } = await getSenatorSummaries();
  const active = senators
    .filter((s) => (s.tradeCount || 0) > 0)
    .sort((a, b) => (b.tradeCount || 0) - (a.tradeCount || 0));

  return (
    <main className="container-page py-10">
      <PageHeader
        title="Investments"
        subtitle="Senators with disclosed congressional trades in the synchronized Quiver dataset. This is reported activity, not a live portfolio."
      />
      <div className="mb-8 flex flex-wrap gap-4 text-sm">
        <SourceBadge source="Quiver Quantitative (synchronized)" />
        <Link href="/trump-trades" className="font-medium hover:underline">
          Trump stock trades
        </Link>
      </div>
      <SenatorsList senators={active} />
    </main>
  );
}
