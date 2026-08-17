"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { DONATION_LINKS, VENMO_AVAILABLE } from "@/lib/donations";
import {
  BuyMeACoffeeIcon,
  ExternalHintIcon,
  VenmoIcon,
} from "@/components/support/DonationIcons";

type SupportPoliteiaProps = {
  variant?: "navbar" | "footer";
  className?: string;
};

export function SupportPoliteia({
  variant = "navbar",
  className,
}: SupportPoliteiaProps) {
  const [open, setOpen] = useState(false);
  const [hoverMenu, setHoverMenu] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    const mq = window.matchMedia(
      "(hover: hover) and (pointer: fine) and (min-width: 768px)"
    );
    const apply = () => {
      setHoverMenu(mq.matches);
      if (!mq.matches) setOpen(false);
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      wrapRef.current?.querySelector<HTMLAnchorElement>("a[data-support-trigger]")?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const triggerClass =
    variant === "footer"
      ? "inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted"
      : "inline-flex items-center rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-muted hover:text-foreground";

  return (
    <div
      ref={wrapRef}
      className={cn("relative", className)}
      onMouseEnter={() => hoverMenu && setOpen(true)}
      onMouseLeave={() => hoverMenu && setOpen(false)}
      onFocusCapture={() => hoverMenu && setOpen(true)}
      onBlurCapture={(e) => {
        if (!wrapRef.current?.contains(e.relatedTarget as Node)) {
          setOpen(false);
        }
      }}
    >
      <Link
        href="/donate"
        data-support-trigger=""
        className={triggerClass}
        aria-label="Support Politeia"
        aria-expanded={hoverMenu ? open : undefined}
        aria-haspopup={hoverMenu ? "menu" : undefined}
        aria-controls={hoverMenu ? menuId : undefined}
      >
        Support Politeia
      </Link>

      {hoverMenu ? (
        <div
          id={menuId}
          role="menu"
          aria-label="Donation options"
          aria-hidden={!open}
          className={cn(
            "absolute z-50 w-[272px] pt-2",
            variant === "footer" ? "left-0" : "right-0",
            "top-full transition-[opacity,transform,visibility] duration-200 ease-out motion-reduce:transition-none",
            open
              ? "visible translate-y-0 opacity-100"
              : "invisible translate-y-1 pointer-events-none opacity-0"
          )}
        >
          <div className="rounded-lg border border-border bg-card p-3 shadow-elevated backdrop-blur-sm">
            <p className="text-sm font-semibold text-foreground">Support Politeia</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              Thank you for helping keep Politeia independent and accessible.
            </p>
            <div className="mt-3 space-y-1">
              {VENMO_AVAILABLE ? (
                <a
                  href={DONATION_LINKS.venmo}
                  target="_blank"
                  rel="noopener noreferrer"
                  role="menuitem"
                  tabIndex={open ? 0 : -1}
                  aria-label="Venmo (opens in a new tab)"
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
                >
                  <VenmoIcon className="h-7 w-7 shrink-0" />
                  <span className="flex-1 font-medium">Venmo</span>
                  <ExternalHintIcon className="h-3.5 w-3.5 text-muted-foreground" />
                </a>
              ) : (
                <div
                  role="menuitem"
                  aria-disabled="true"
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-muted-foreground"
                >
                  <VenmoIcon className="h-7 w-7 shrink-0" />
                  <span className="flex-1">
                    <span className="block font-medium text-foreground">Venmo</span>
                    <span className="block text-xs">Coming soon</span>
                  </span>
                </div>
              )}
              <a
                href={DONATION_LINKS.buyMeACoffee}
                target="_blank"
                rel="noopener noreferrer"
                role="menuitem"
                tabIndex={open ? 0 : -1}
                aria-label="Buy Me a Coffee (opens in a new tab)"
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm text-foreground transition hover:bg-muted"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-border bg-muted/60 text-muted-foreground">
                  <BuyMeACoffeeIcon className="h-4 w-4" />
                </span>
                <span className="flex-1 font-medium">Buy Me a Coffee</span>
                <ExternalHintIcon className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
