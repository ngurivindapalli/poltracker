import React from "react";
import Link from "next/link";
import { SupportPoliteia } from "@/components/support/SupportPoliteia";

const EXPLORE = [
  { href: "/senators", label: "Senators" },
  { href: "/representatives", label: "Representatives" },
  { href: "/cabinet", label: "Cabinet" },
  { href: "/us/mayors", label: "Mayors" },
  { href: "/candidates", label: "Candidates" },
];

const GLOBAL = [
  { href: "/uk", label: "United Kingdom" },
  { href: "/germany", label: "Germany" },
  { href: "/india", label: "India" },
  { href: "/europe", label: "Europe" },
  { href: "/canada", label: "Canada" },
  { href: "/latin-america", label: "Latin America" },
];

const INTELLIGENCE = [
  { href: "/investments", label: "Investments" },
  { href: "/bills", label: "Legislation" },
  { href: "/campaigns", label: "Campaigns" },
  { href: "/cspan", label: "C-SPAN" },
  { href: "/chat", label: "Ask Politeia" },
];

const RESOURCES = [
  { href: "/about", label: "About" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto grid max-w-[1200px] grid-cols-2 gap-8 px-4 py-12 sm:px-6 md:grid-cols-3 lg:grid-cols-5">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <div className="mb-3 flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-[10px] font-semibold text-primary-foreground">
              P
            </div>
            <span className="text-base font-semibold text-foreground">Politeia</span>
          </div>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Public data on politicians, legislation, and financial activity.
          </p>
        </div>

        <FooterCol title="Explore" items={EXPLORE} />
        <FooterCol title="Global" items={GLOBAL} />
        <FooterCol title="Intelligence" items={INTELLIGENCE} />
        <div>
          <h4 className="mb-3 text-sm font-semibold text-foreground">Resources</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {RESOURCES.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <SupportPoliteia variant="footer" />
          </div>
        </div>
      </div>
      <div className="border-t border-border">
        <p className="mx-auto max-w-[1200px] px-4 py-6 text-center text-xs text-muted-foreground sm:px-6">
          © {new Date().getFullYear()} Politeia. Data sourced from official
          government APIs and public disclosures. Estimates are labeled as such
          and are not official government figures.
        </p>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { href: string; label: string }[];
}) {
  return (
    <div>
      <h4 className="mb-3 text-sm font-semibold text-foreground">{title}</h4>
      <ul className="space-y-2 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
