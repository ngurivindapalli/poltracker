import SenatorsList from "@/components/SenatorsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import Link from "next/link";

/** Serve precomputed summaries; revalidate every 10 minutes (no live Quiver). */
export const revalidate = 600;

function formatStaleness(iso: string | null): string | null {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return null;
  const hours = Math.max(0, Math.round((Date.now() - t) / 3_600_000));
  if (hours < 1) return "Financial data updated less than an hour ago.";
  if (hours < 48) return `Financial data last updated ${hours} hours ago.`;
  const days = Math.round(hours / 24);
  return `Financial data last updated ${days} day${days === 1 ? "" : "s"} ago.`;
}

export default async function SenatorsPage() {
  const { senators, dataUpdatedAt } = await getSenatorSummaries();
  const staleness = formatStaleness(dataUpdatedAt);

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
        title="U.S. Senate"
        subtitle="Directory of current United States Senators with precomputed financial summaries from synchronized Quiver data."
      />

      {(dataUpdatedAt || staleness) && (
        <p className="mb-6 text-sm text-[#64748B]">
          {dataUpdatedAt ? (
            <>
              Last updated:{" "}
              <time dateTime={dataUpdatedAt}>
                {new Date(dataUpdatedAt).toLocaleString()}
              </time>
              {staleness ? ` · ${staleness}` : null}
            </>
          ) : (
            staleness
          )}
        </p>
      )}

      <Section>
        <SenatorsList senators={senators} />
      </Section>
    </main>
  );
}
