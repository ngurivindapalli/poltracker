import React from "react";
import Link from "next/link";
import { SupportLinks } from "@/components/SupportLinks";

export function Footer() {
  return (
    <footer className="border-t border-border bg-background py-12 mt-auto">
      <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center text-primary-foreground font-bold text-xs">
              P
            </div>
            <span className="text-[18px] font-bold text-foreground">
              Politeia
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Professional political intelligence and transparency platform. 
            Tracking investments, legislation, and influence networks.
          </p>
        </div>
        
        <div>
          <h4 className="text-foreground font-bold mb-4">Regions</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/" className="hover:text-primary">United States</Link></li>
            <li><Link href="/uk" className="hover:text-primary">United Kingdom</Link></li>
            <li><Link href="/germany" className="hover:text-primary">Germany</Link></li>
            <li><Link href="/india" className="hover:text-primary">India</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-bold mb-4">Data</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/senators" className="hover:text-primary">Senators</Link></li>
            <li><Link href="/representatives" className="hover:text-primary">Representatives</Link></li>
            <li><Link href="/investments" className="hover:text-primary">Investments</Link></li>
            <li><Link href="/cspan" className="hover:text-primary">C-SPAN Schedule</Link></li>
            <li><Link href="/bills" className="hover:text-primary">Legislation</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/privacy" className="hover:text-primary">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-primary">Terms of Service</Link></li>
            <li><Link href="/about" className="hover:text-primary">About Us</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-foreground font-bold mb-4">Support Politeia</h4>
          <SupportLinks variant="footer" />
        </div>
      </div>
      <div className="max-w-[1300px] mx-auto px-6 mt-12 pt-8 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} Politeia. All rights reserved. Data sourced from official government APIs.
        </p>
      </div>
    </footer>
  );
}
