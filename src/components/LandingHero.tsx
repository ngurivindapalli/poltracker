"use client";

import Link from "next/link";
import HeroFlags from "@/components/HeroFlags";

export default function LandingHero() {
  return (
    <section className="landingHero">
      <div className="landingInner">
        <div className="landingLeft">
          <h1 className="landingTitle">
            Everything you need — <br />
            in one place.
          </h1>

          <p className="landingSubtitle">
            Track politicians, legislation, and political news worldwide — with clean profiles,
            searchable coverage, and reliable summaries.
          </p>

          <div className="ctaRow">
            <Link className="btnPrimary" href="/us">
              Explore the U.S.
            </Link>
            <Link className="btnSecondary" href="/germany">
              Explore Germany
            </Link>
          </div>
        </div>

        <div className="landingRight">
          <div className="flagCanvas">
            <HeroFlags />
            <div className="flagGlow" />
          </div>
        </div>
      </div>
    </section>
  );
}
