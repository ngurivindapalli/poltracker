"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { AuthButton } from "@/components/auth/AuthButton";
import { useTranslation } from "@/components/i18n/I18nProvider";
import { SupportPoliteia } from "@/components/support/SupportPoliteia";
import { SearchTrigger } from "@/components/search/SearchTrigger";

type NavItem = { href: string; label: string };

function NavDropdown({
  label,
  active,
  items,
}: {
  label: string;
  active: boolean;
  items: NavItem[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className={clsx(
          "rounded-md px-2 py-1 text-sm font-medium transition",
          active
            ? "text-foreground"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open && (
        <div
          id={id}
          className="absolute left-0 top-full z-50 mt-2 w-52 rounded-lg border border-border bg-card p-2 shadow-elevated"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { t } = useTranslation();

  const isActive = (path: string) =>
    pathname === path || (path !== "/" && pathname.startsWith(path));

  const explore: NavItem[] = [
    { href: "/senators", label: t("Senators") },
    { href: "/representatives", label: t("Representatives") },
    { href: "/cabinet", label: "Cabinet" },
    { href: "/us/mayors", label: "Mayors" },
    { href: "/candidates", label: "Candidates" },
  ];
  const global: NavItem[] = [
    { href: "/uk", label: "United Kingdom" },
    { href: "/germany", label: "Germany" },
    { href: "/india", label: "India" },
    { href: "/europe", label: t("Europe") },
    { href: "/canada", label: t("Canada") },
    { href: "/latin-america", label: t("Latin America") },
  ];
  const intelligence: NavItem[] = [
    { href: "/investments", label: "Investments" },
    { href: "/bills", label: "Legislation" },
    { href: "/campaigns", label: t("Campaigns") },
    { href: "/cspan", label: "C-SPAN" },
    { href: "/chat", label: "Ask Politeia" },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [isMenuOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/85 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/"
            className="group flex shrink-0 items-center gap-2.5"
            aria-label="Politeia home"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-semibold text-primary-foreground">
              P
            </div>
            <span className="text-[15px] font-semibold tracking-tight text-foreground">
              Politeia
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            <NavDropdown
              label="Explore"
              active={["/senators", "/representatives", "/cabinet", "/us", "/candidates"].some(
                isActive
              )}
              items={explore}
            />
            <NavDropdown
              label="Global"
              active={["/uk", "/germany", "/india", "/europe", "/canada", "/latin-america"].some(
                isActive
              )}
              items={global}
            />
            <NavDropdown
              label="Intelligence"
              active={["/investments", "/bills", "/campaigns", "/cspan", "/chat", "/trump-trades"].some(
                isActive
              )}
              items={intelligence}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <SearchTrigger />
          <div className="hidden items-center gap-2 md:flex">
            <SupportPoliteia variant="navbar" />
            <LanguageSelector />
            <AuthButton />
            <ThemeToggle />
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        <div className="border-t border-border bg-background lg:hidden">
          <div className="mx-auto flex max-w-[1200px] flex-col gap-5 px-4 py-5 text-sm sm:px-6">
            <MobileGroup title="Explore" items={explore} />
            <MobileGroup title="Global" items={global} />
            <MobileGroup title="Intelligence" items={intelligence} />
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
              <SupportPoliteia variant="navbar" />
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

function MobileGroup({ title, items }: { title: string; items: NavItem[] }) {
  return (
    <div>
      <p className="label-caps mb-2">{title}</p>
      <div className="grid grid-cols-2 gap-1">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-md px-2 py-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
