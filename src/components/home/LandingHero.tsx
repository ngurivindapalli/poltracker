import Link from "next/link";
import { SearchTrigger } from "@/components/search/SearchTrigger";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, hsl(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--border)) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse at top, black 20%, transparent 75%)",
        }}
        aria-hidden
      />
      <div className="relative mx-auto max-w-[1200px] px-4 py-16 sm:px-6 sm:py-20 lg:py-24">
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Public data on politics and money
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
          Profiles, financial disclosures, legislation, and news. From official
          sources, labeled when estimated.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/senators"
            className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Explore U.S. politics
          </Link>
          <Link
            href="/uk"
            className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted"
          >
            Explore global leaders
          </Link>
          <SearchTrigger className="h-[42px] justify-start sm:ml-2 sm:min-w-[220px]" label="Search people, states, bills…" />
        </div>
      </div>
    </section>
  );
}
