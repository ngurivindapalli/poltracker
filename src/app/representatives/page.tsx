import RepresentativesList from "@/components/RepresentativesList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { getRepresentativeSummaries } from "@/lib/representatives/summaries";
import Link from "next/link";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "U.S. House of Representatives",
  description:
    "Directory of current members of the U.S. House of Representatives.",
};

export default async function RepresentativesPage() {
  const { representatives, dataUpdatedAt } = await getRepresentativeSummaries();

  return (
    <main className="max-w-[1300px] mx-auto px-6 py-12">
      <Link
        href="/"
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
        Back to Home
      </Link>

      <PageHeader
        title="U.S. House of Representatives"
        subtitle="Current members of the U.S. House."
      />

      {dataUpdatedAt ? (
        <p className="mb-6 text-sm text-muted-foreground">
          Last updated {new Date(dataUpdatedAt).toLocaleString()}
        </p>
      ) : null}

      <Section>
        <RepresentativesList representatives={representatives} />
      </Section>
    </main>
  );
}
