import { PageHeader } from "@/components/ui/PageHeader";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy",
};

export default function PrivacyPage() {
  return (
    <main className="container-page py-10">
      <PageHeader title="Privacy" subtitle="How Politeia handles information." />
      <div className="max-w-2xl space-y-4 text-sm leading-relaxed text-muted-foreground">
        <p>
          Politician, legislation, and financial disclosure data shown on Politeia
          is public information from government APIs and public datasets.
        </p>
        <p>
          Account features, if enabled, store only what is required to sign in
          and participate in comments. We do not sell personal data.
        </p>
      </div>
    </main>
  );
}
