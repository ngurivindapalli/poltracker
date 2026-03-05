import React from "react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="bg-[#F8FAFC] border-t border-[#E2E8F0] py-12 mt-auto">
      <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-6 h-6 bg-[#1E3A5F] rounded flex items-center justify-center text-white font-bold text-xs">
              P
            </div>
            <span className="text-[18px] font-bold text-[#1E3A5F]">
              Politeia
            </span>
          </div>
          <p className="text-[#64748B] text-sm leading-relaxed">
            Professional political intelligence and transparency platform. 
            Tracking investments, legislation, and influence networks.
          </p>
        </div>
        
        <div>
          <h4 className="text-[#1E3A5F] font-bold mb-4">Regions</h4>
          <ul className="space-y-2 text-sm text-[#64748B]">
            <li><Link href="/" className="hover:text-[#2563EB]">United States</Link></li>
            <li><Link href="/uk" className="hover:text-[#2563EB]">United Kingdom</Link></li>
            <li><Link href="/germany" className="hover:text-[#2563EB]">Germany</Link></li>
            <li><Link href="/india" className="hover:text-[#2563EB]">India</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1E3A5F] font-bold mb-4">Data</h4>
          <ul className="space-y-2 text-sm text-[#64748B]">
            <li><Link href="/senators" className="hover:text-[#2563EB]">Senators</Link></li>
            <li><Link href="/representatives" className="hover:text-[#2563EB]">Representatives</Link></li>
            <li><Link href="/investments" className="hover:text-[#2563EB]">Investments</Link></li>
            <li><Link href="/cspan" className="hover:text-[#2563EB]">C-SPAN Schedule</Link></li>
            <li><Link href="/bills" className="hover:text-[#2563EB]">Legislation</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[#1E3A5F] font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-[#64748B]">
            <li><Link href="/privacy" className="hover:text-[#2563EB]">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-[#2563EB]">Terms of Service</Link></li>
            <li><Link href="/about" className="hover:text-[#2563EB]">About Us</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-[1300px] mx-auto px-6 mt-12 pt-8 border-t border-[#E2E8F0] text-center text-sm text-[#94A3B8]">
        &copy; {new Date().getFullYear()} Politeia. All rights reserved. Data sourced from official government APIs.
      </div>
    </footer>
  );
}
