import React from "react";
import Link from "next/link";

export function LandingHero() {
  return (
    <section className="text-center py-24 px-6 max-w-4xl mx-auto">
      <h1 className="text-5xl font-semibold tracking-tight leading-tight">
        Political Transparency,
        <span className="text-primary"> Refined</span>
      </h1>

      <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
        Track investments, relationships, and influence across global governments
        with institutional-grade data and visualization.
      </p>

      <div className="mt-10 flex justify-center gap-4">
        <Link
          href="/senators"
          className="px-6 py-3 rounded-lg bg-primary text-primary-foreground shadow-subtle hover:opacity-90 transition"
        >
          Explore U.S. Senate
        </Link>

        <Link
          href="/global/narendra-modi"
          className="px-6 py-3 rounded-lg border border-border bg-card hover:bg-muted transition"
        >
          View Global Leaders
        </Link>
        </div>
    </section>
  );
}
