import Link from "next/link";
import { SearchTrigger } from "@/components/search/SearchTrigger";

const CATEGORIES = [
  { label: "People", detail: "Politicians & Profiles" },
  { label: "Money", detail: "Financial Disclosures" },
  { label: "Legislation", detail: "Bills & Votes" },
  { label: "Government", detail: "Contracts & Lobbying" },
  { label: "Elections", detail: "Federal, State & County" },
  { label: "News", detail: "News & Public Activity" },
] as const;

export function LandingHero() {
  return (
    <section className="relative z-0 overflow-hidden border-b border-border">
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
      <div className="relative mx-auto grid max-w-[1200px] items-start gap-6 px-4 py-8 sm:px-6 sm:gap-8 sm:py-16 lg:grid-cols-12 lg:gap-x-12 lg:gap-y-6 lg:py-20">
        <div className="lg:col-span-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Public data. One place.
          </p>
          <h1 className="mt-2 max-w-3xl text-[1.85rem] font-semibold leading-[1.15] tracking-tight text-foreground sm:mt-3 sm:text-5xl lg:text-[3.25rem]">
            Explore the people, money, and decisions behind American politics.
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted-foreground sm:mt-5 sm:text-lg">
            Politeia brings politician profiles, financial disclosures, legislation,
            government contracts, lobbying, elections, news, and public activity
            together from official and labeled sources.
          </p>

          <div className="mt-5 flex flex-col gap-2.5 sm:mt-7 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href="/senators"
              className="inline-flex items-center justify-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Explore U.S. Politics
            </Link>
            <SearchTrigger
              className="h-[42px] justify-start sm:min-w-[260px]"
              label="Search politicians, states, bills..."
            />
            <span
              className="inline-flex items-center justify-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-muted-foreground/70"
              aria-disabled="true"
            >
              Global coverage coming soon
            </span>
          </div>
        </div>

        <aside
          className="lg:col-span-5 lg:row-span-2"
          aria-label="What you can research"
        >
          <div className="rounded-lg border border-border bg-card/90 p-4 shadow-subtle sm:p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              What you can research
            </p>
            <ul className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border">
              {CATEGORIES.map((item) => (
                <li key={item.label} className="bg-card px-3 py-2.5 sm:px-4 sm:py-3.5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium leading-snug text-foreground">
                    {item.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <p className="max-w-xl text-xs leading-relaxed text-muted-foreground lg:col-span-7">
          Built from public records and official sources, with estimated or
          compiled data clearly labeled.
        </p>
      </div>
    </section>
  );
}
