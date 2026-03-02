import React from "react";
import { Button } from "@/components/ui/Button";

export function LandingHero() {
  return (
    <section className="bg-white border-b border-[#E2E8F0] py-24 text-center">
      <div className="max-w-[800px] mx-auto px-6">
        <h1 className="text-[48px] md:text-[56px] font-bold text-[#1E3A5F] mb-6 leading-[1.1] tracking-tight">
          Political Transparency Made Accessible
        </h1>
        <p className="text-[20px] text-[#64748B] mb-10 leading-relaxed max-w-[600px] mx-auto">
          Track investments, relationships, and influence across government with 
          professional-grade data and visualizations.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button variant="primary" size="lg" className="w-full sm:w-auto">
            Explore U.S. Senate
          </Button>
          <Button variant="outline" size="lg" className="w-full sm:w-auto">
            View Global Leaders
          </Button>
        </div>
      </div>
    </section>
  );
}
