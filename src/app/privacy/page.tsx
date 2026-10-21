import { PageHeader } from "@/components/ui/PageHeader";
import { PrivacyConsentControls } from "@/components/consent/PrivacyConsentControls";
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
          If you sign in with Google, Politeia receives a verified email, display
          name, profile image, and a stable Google account identifier. That
          information is used to create or sign in to your Politeia account and
          to associate comments you post. Google access tokens are not stored.
        </p>
        <p>
          Community comments are stored in Politeia&apos;s PostgreSQL database and
          remain associated with your account. Do not post information you do not
          want to be public.
        </p>
        <p>
          Session cookies are used to keep you signed in. If advertising is
          enabled, Google AdSense may use cookies according to the choice you
          make below. We do not sell personal data.
        </p>
        <PrivacyConsentControls />
      </div>
    </main>
  );
}
