import { PageHeader } from "@/components/ui/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About",
  description:
    "How Politeia sources public government and financial disclosure data.",
};

export default function AboutPage() {
  return (
    <main className="container-page py-10">
      <PageHeader
        title="About Politeia"
        subtitle="Public information on politicians, legislation, financial activity, and news."
      />
      <div className="prose-none max-w-2xl space-y-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Politeia exists to make government and political information easier to
          understand and easier to access. We do not fabricate political or
          financial data. Profiles, trades, and estimates come from public
          sources and are labeled when they are estimates rather than official
          government figures.
        </p>
        <h2 className="text-lg font-semibold text-foreground">Data sources</h2>
        <ul className="list-disc space-y-2 pl-5">
          <li>Congress.gov (members, legislation)</li>
          <li>Quiver Quantitative (congressional trading, estimated net worth)</li>
          <li>C-SPAN public schedule feeds</li>
          <li>Official member websites and public social handles where available</li>
        </ul>
        <h2 className="text-lg font-semibold text-foreground">Methodology</h2>
        <p>
          Financial summaries are precomputed during background synchronization.
          Listing pages read the last successful sync so browsing does not wait
          on live third-party APIs.
        </p>
      </div>
    </main>
  );
}
