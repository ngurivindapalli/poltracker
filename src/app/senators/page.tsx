import SenatorsList from "@/components/SenatorsList";
import { PageHeader } from "@/components/ui/PageHeader";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import { relativeTime } from "@/lib/format";
import { SourceBadge } from "@/components/data/SourceBadge";
import type { Metadata } from "next";

export const revalidate = 600;

export const metadata: Metadata = {
  title: "U.S. Senate",
  description:
    "Directory of current United States Senators with estimated net worth and disclosed trading summaries from synchronized public data.",
};

export default async function SenatorsPage() {
  const { senators, dataUpdatedAt } = await getSenatorSummaries();
  const staleness = relativeTime(dataUpdatedAt);

  return (
    <main className="container-page py-10 sm:py-12">
      <PageHeader
        title="U.S. Senate"
        subtitle="Current senators with estimated net worth and disclosed trading summaries. Financial figures are synchronized from Quiver Quantitative and labeled as estimates."
      />

      {(dataUpdatedAt || staleness) && (
        <div className="mb-8 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {dataUpdatedAt ? (
            <time dateTime={dataUpdatedAt}>
              Last updated {new Date(dataUpdatedAt).toLocaleString()}
            </time>
          ) : null}
          {staleness ? <span>· {staleness}</span> : null}
          <SourceBadge source="Quiver Quantitative (synchronized)" />
        </div>
      )}

      <SenatorsList senators={senators} />
    </main>
  );
}
