"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { AuthButton } from "@/components/auth/AuthButton";
import { useTranslation } from "@/components/i18n/I18nProvider";
import { SupportLinks } from "@/components/SupportLinks";

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) => pathname === path || (path !== "/" && pathname.startsWith(path));

  const navLinkClass = (path: string) =>
    clsx(
      "relative whitespace-nowrap transition-all duration-300 hover:scale-105",
      isActive(path)
        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
        : "text-slate-400 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
    );

  const navButtonClass = (...paths: string[]) =>
    clsx(
      "relative whitespace-nowrap transition-all duration-300 hover:scale-105",
      paths.some((path) => isActive(path))
        ? "text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
        : "text-slate-400 hover:text-white hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]"
    );

  return (
    <header className="sticky top-0 z-50 h-20 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 shadow-lg shadow-black/20 backdrop-blur-xl">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <Link href="/" className="group flex shrink-0 items-center gap-2.5 transition-transform duration-300 hover:scale-[1.02]">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-md shadow-primary/20 transition-shadow duration-300 group-hover:shadow-lg group-hover:shadow-primary/30">
              P
            </div>
            <span className="text-base font-semibold tracking-tight text-white sm:text-lg">
              Politeia
            </span>
          </Link>

          <div className="ml-1 sm:ml-2">
            <SupportLinks variant="navbar" />
          </div>

          <div className="mx-1 hidden h-8 w-px bg-white/10 md:block" />

          <nav className="hidden items-center gap-5 text-sm font-medium md:flex lg:gap-6">
            <div className="relative group">
              <button className={navButtonClass("/", "/senators", "/representatives", "/cabinet", "/us")}>
                US
              </button>
              <div className="absolute left-0 top-full z-50 hidden pt-3 group-hover:block">
                <div className="card w-44 p-3">
                  <Link href="/senators" className="block py-2 text-muted-foreground hover:text-foreground">
                    {t("Senators")}
                  </Link>
                  <Link href="/representatives" className="block py-2 text-muted-foreground hover:text-foreground">
                    {t("Representatives")}
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

            <div className="relative group">
              <button
                className={navButtonClass(
                  "/uk",
                  "/germany",
                  "/india",
                  "/europe",
                  "/canada",
                  "/latin-america"
                )}
              >
                {t("Countries")}
              </button>
              <div className="absolute left-0 top-full z-50 hidden pt-3 group-hover:block">
                <div className="card w-48 p-3">
                  <Link href="/uk" className="block py-2 text-muted-foreground hover:text-foreground">
                    United Kingdom
                  </Link>
                  <Link href="/germany" className="block py-2 text-muted-foreground hover:text-foreground">
                    Germany
                  </Link>
                  <Link href="/india" className="block py-2 text-muted-foreground hover:text-foreground">
                    India
                  </Link>
                  <div className="my-1 border-t border-border" />
                  <Link href="/europe" className="block py-2 font-medium text-muted-foreground hover:text-foreground">
                    {t("Europe")}
                  </Link>
                  <Link href="/canada" className="block py-2 font-medium text-muted-foreground hover:text-foreground">
                    {t("Canada")}
                  </Link>
                  <Link
                    href="/latin-america"
                    className="block py-2 font-medium text-muted-foreground hover:text-foreground"
                  >
                    {t("Latin America")}
                  </Link>
                </div>
              </div>
            </div>

            <Link href="/campaigns" className={navLinkClass("/campaigns")}>
              {t("Campaigns")}
            </Link>
            <Link href="/chat" className={navLinkClass("/chat")}>
              AI Chat
            </Link>
            <Link href="/candidates" className={navLinkClass("/candidates")}>
              Candidates
            </Link>
          </nav>
        </div>

        <div className="hidden shrink-0 items-center gap-3 md:flex">
          <LanguageSelector />
          <AuthButton />
          <ThemeToggle />
        </div>

        <button
          type="button"
          className="shrink-0 rounded-lg p-2 text-slate-300 transition-all duration-300 hover:scale-105 hover:bg-white/5 hover:text-white md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
          aria-expanded={isMenuOpen}
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>
      </div>

      {isMenuOpen && (
        <div className="border-t border-white/10 bg-slate-950/95 backdrop-blur-xl md:hidden">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 text-sm font-medium sm:px-6">
            <Link
              href="/"
              className={navLinkClass("/")}
              onClick={() => setIsMenuOpen(false)}
            >
              US
            </Link>
            <Link
              href="/senators"
              className={navLinkClass("/senators")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Senators")}
            </Link>
            <Link
              href="/representatives"
              className={navLinkClass("/representatives")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Representatives")}
            </Link>
            <Link
              href="/cabinet"
              className={navLinkClass("/cabinet")}
              onClick={() => setIsMenuOpen(false)}
            >
              Cabinet
            </Link>
            <Link href="/uk" className={navLinkClass("/uk")} onClick={() => setIsMenuOpen(false)}>
              UK
            </Link>
            <Link
              href="/germany"
              className={navLinkClass("/germany")}
              onClick={() => setIsMenuOpen(false)}
            >
              Germany
            </Link>
            <Link
              href="/india"
              className={navLinkClass("/india")}
              onClick={() => setIsMenuOpen(false)}
            >
              India
            </Link>
            <Link
              href="/europe"
              className={navLinkClass("/europe")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Europe")}
            </Link>
            <Link
              href="/canada"
              className={navLinkClass("/canada")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Canada")}
            </Link>
            <Link
              href="/latin-america"
              className={navLinkClass("/latin-america")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Latin America")}
            </Link>
            <Link
              href="/campaigns"
              className={navLinkClass("/campaigns")}
              onClick={() => setIsMenuOpen(false)}
            >
              {t("Campaigns")}
            </Link>
            <Link href="/chat" className={navLinkClass("/chat")} onClick={() => setIsMenuOpen(false)}>
              AI Chat
            </Link>
            <Link
              href="/candidates"
              className={navLinkClass("/candidates")}
              onClick={() => setIsMenuOpen(false)}
            >
              Candidates
            </Link>
            <div className="flex items-center gap-3 border-t border-white/10 pt-3">
              <LanguageSelector />
              <AuthButton />
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
