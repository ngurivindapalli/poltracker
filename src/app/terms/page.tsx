import { PageHeader } from "@/components/ui/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms",
};

export default function TermsPage() {
  return (
    <main className="container-page py-10">
      <PageHeader
        title="Terms of service"
        subtitle="Politeia publishes public political and financial information for research and exploration."
      />
      <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Data may be incomplete, delayed, or estimated. Estimated net worth and
          trade ranges are not official government figures and should not be
          treated as investment advice.
        </p>
        <p>
          You are responsible for verifying primary sources before relying on
          this information for reporting, research, or legal purposes.
        </p>
      </div>
    </main>
  );
}
