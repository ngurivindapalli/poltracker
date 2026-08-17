"use client";

import Link from "next/link";
import HeroFlags from "@/components/HeroFlags";

export default function LandingHero() {
  return (
    <section className="landingHero">
      <div className="landingInner">
        <div className="landingLeft">
          <h1 className="landingTitle">
            Public data on politics and money
          </h1>

          <p className="landingSubtitle">
            Profiles, financial disclosures, legislation, and news. From official
            sources, labeled when estimated.
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
