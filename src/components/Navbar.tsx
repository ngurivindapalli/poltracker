"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/" && pathname === "/") return "text-foreground";
    if (path !== "/" && pathname.startsWith(path)) return "text-foreground";
    return "text-muted-foreground hover:text-foreground";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
            P
          </div>
          <span className="font-semibold text-lg tracking-tight">Politeia</span>
        </Link>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium">
          <div className="relative group">
            <button className={isActive("/")}>US</button>
            <div className="absolute left-0 top-full pt-2 hidden group-hover:block">
              <div className="card w-44 p-3">
                <Link href="/senators" className="block py-2 text-muted-foreground hover:text-foreground">
                  Senators
                </Link>
                <Link href="/representatives" className="block py-2 text-muted-foreground hover:text-foreground">
                  House
                </Link>
                <Link href="/cabinet" className="block py-2 text-muted-foreground hover:text-foreground">
                  Cabinet
                </Link>
                <Link href="/us/mayors" className="block py-2 text-muted-foreground hover:text-foreground">
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
          <ThemeToggle />
        </div>

        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          <button
            className="text-foreground"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
              />
            </svg>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t border-border bg-card">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3 text-sm font-medium">
            <Link href="/" className={isActive("/")} onClick={() => setIsMenuOpen(false)}>
              US
            </Link>
            <Link href="/senators" className={isActive("/senators")} onClick={() => setIsMenuOpen(false)}>
              Senators
            </Link>
            <Link href="/representatives" className={isActive("/representatives")} onClick={() => setIsMenuOpen(false)}>
              House
            </Link>
            <Link href="/cabinet" className={isActive("/cabinet")} onClick={() => setIsMenuOpen(false)}>
              Cabinet
            </Link>
            <Link href="/uk" className={isActive("/uk")} onClick={() => setIsMenuOpen(false)}>
              UK
            </Link>
            <Link href="/germany" className={isActive("/germany")} onClick={() => setIsMenuOpen(false)}>
              Germany
            </Link>
            <Link href="/india" className={isActive("/india")} onClick={() => setIsMenuOpen(false)}>
              India
            </Link>
            <Link href="/chat" className={isActive("/chat")} onClick={() => setIsMenuOpen(false)}>
              AI Chat
            </Link>
            <Link href="/candidates" className={isActive("/candidates")} onClick={() => setIsMenuOpen(false)}>
              Candidates
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
