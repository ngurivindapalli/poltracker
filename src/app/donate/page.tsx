import type { Metadata } from "next";
import { DonationCards } from "@/components/support/DonationCards";

export const metadata: Metadata = {
  title: "Support Politeia",
  description:
    "Help keep Politeia accessible. Support the platform through Venmo or Buy Me a Coffee.",
};

export default function DonatePage() {
  return (
    <main className="container-page py-10 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Support Politeia
        </h1>
        <div className="mt-5 space-y-4 text-base leading-relaxed text-muted-foreground">
          <p>
            Politeia is built to make political information easier to understand,
            explore, and verify.
          </p>
          <p>
            We bring together public information on politicians, legislation,
            financial activity, news, and government.
          </p>
          <p>
            Your support helps us keep improving the platform, expanding
            coverage, and maintaining infrastructure.
          </p>
        </div>

        <div className="mt-10">
          <DonationCards />
        </div>

        <section className="mt-16 border-t border-border pt-10 text-center">
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Help keep Politeia growing
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Every contribution helps us maintain the platform and continue
            improving access to political information.
          </p>
          <a
            href="#ways-to-give"
            className="mt-6 inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Support Politeia
          </a>
        </section>
      </div>
    </main>
  );
}
