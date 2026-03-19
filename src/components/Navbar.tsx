"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return "text-[#2563EB]";
    if (path !== "/" && pathname.startsWith(path)) return "text-[#2563EB]";
    return "text-[#334155] hover:text-[#1E3A5F]";
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0] shadow-sm h-[64px]">
      <div className="max-w-[1400px] mx-auto px-6 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 text-decoration-none">
          <div className="w-8 h-8 bg-[#1E3A5F] rounded flex items-center justify-center text-white font-bold text-lg">
            P
          </div>
          <span className="text-[20px] font-bold text-[#1E3A5F] tracking-tight">
            Politeia
          </span>
        </Link>

        {/* Desktop Navigation - Center */}
        <div className="hidden md:flex items-center gap-8">
          {/* Search Bar */}
          <div className="relative w-[300px]">
            <input
              type="text"
              placeholder="Search Senators, MPs, Bills..."
              className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded-full py-1.5 px-4 text-sm text-[#334155] focus:outline-none focus:border-[#2563EB] focus:ring-1 focus:ring-[#2563EB]"
            />
            <svg
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#94A3B8]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        {/* Desktop Navigation - Right */}
        <div className="hidden md:flex items-center gap-6 text-[14px] font-semibold">
          {/* US Dropdown */}
          <div className="relative group">
            <button className={isActive("/")}>
              US
            </button>
            <div
              className="
                absolute left-0 top-full
                pt-1
                hidden group-hover:block
              "
            >
              <div className="bg-white shadow-lg rounded-xl p-4 w-44">
                <Link
                  href="/senators"
                  className="block py-2 hover:text-blue-600"
                >
                  Senators
                </Link>
                <Link
                  href="/representatives"
                  className="block py-2 hover:text-blue-600"
                >
                  House
                </Link>
                <Link
                  href="/cabinet"
                  className="block py-2 hover:text-blue-600"
                >
                  Cabinet
                </Link>
                <Link
                  href="/us/mayors"
                  className="block py-2 hover:text-blue-600"
                >
                  Mayors
                </Link>
              </div>
            </div>
          </div>
          <Link href="/uk" className={isActive("/uk")}>
            UK
          </Link>
          <Link href="/germany" className={isActive("/germany")}>
            Germany
          </Link>
          <Link href="/india" className={isActive("/india")}>
            India
          </Link>
          <Link href="/chat" className={isActive("/chat")}>
            AI Chat
          </Link>
          <Link href="/candidates" className={isActive("/candidates")}>
            Candidates
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#1E3A5F]"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                isMenuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 6h16M4 12h16M4 18h16"
              }
            />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden absolute top-[64px] left-0 right-0 bg-white border-b border-[#E2E8F0] shadow-lg p-4 flex flex-col gap-4">
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-[#F1F5F9] border border-[#E2E8F0] rounded px-3 py-2 text-sm"
          />
          <Link
            href="/"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            US
          </Link>
          <Link
            href="/senators"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Senators
          </Link>
          <Link
            href="/representatives"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            House
          </Link>
          <Link
            href="/cabinet"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Cabinet
          </Link>
          <Link
            href="/uk"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            UK
          </Link>
          <Link
            href="/germany"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Germany
          </Link>
          <Link
            href="/india"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            India
          </Link>
          <Link
            href="/chat"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            AI Chat
          </Link>
          <Link
            href="/candidates"
            className="text-[#334155] font-semibold py-2"
            onClick={() => setIsMenuOpen(false)}
          >
            Candidates
          </Link>
        </div>
      )}
    </nav>
  );
}
