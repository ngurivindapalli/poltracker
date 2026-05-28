"use client";

import clsx from "clsx";

const BUY_ME_A_COFFEE_URL = "https://buymeacoffee.com/politeia.co";

type SupportLinksProps = {
  variant?: "navbar" | "footer";
  className?: string;
};

function Tooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-slate-900 px-2 py-1 text-xs font-medium text-slate-100 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

function FooterTooltip({ label }: { label: string }) {
  return (
    <span
      role="tooltip"
      className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground px-2 py-1 text-xs font-medium text-background opacity-0 shadow-sm transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
    >
      {label}
    </span>
  );
}

function BuyMeACoffeeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M6 8h10a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4v-1a2 2 0 0 1 2-2Z" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6" />
      <path d="M6 14v2a2 2 0 0 0 2 2h8" />
      <path d="M18 10h1a2 2 0 0 1 0 4h-1" />
    </svg>
  );
}

export function SupportLinks({ variant = "navbar", className }: SupportLinksProps) {
  if (variant === "footer") {
    const iconButtonBase =
      "group relative inline-flex shrink-0 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background";

    return (
      <div className={clsx("flex items-center gap-2", className)}>
        <a
          href={BUY_ME_A_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Support Politeia"
          title="Support Politeia"
          className={clsx(iconButtonBase, "h-9 w-9")}
        >
          <FooterTooltip label="Support Politeia" />
          <BuyMeACoffeeIcon className="h-[18px] w-[18px]" />
        </a>

        <span
          role="img"
          aria-label="Venmo coming soon"
          title="Venmo coming soon"
          className={clsx(
            iconButtonBase,
            "h-9 w-9 cursor-default opacity-75 hover:bg-card hover:text-muted-foreground"
          )}
        >
          <FooterTooltip label="Venmo coming soon" />
          <span
            aria-hidden="true"
            className="flex h-5 w-5 items-center justify-center rounded-full bg-[#008CFF]/15 text-[11px] font-bold leading-none text-[#008CFF] dark:bg-[#008CFF]/25 dark:text-[#5CB8FF]"
          >
            V
          </span>
        </span>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center gap-2 sm:gap-2.5", className)}>
      <a
        href={BUY_ME_A_COFFEE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Support Politeia"
        title="Support Politeia"
        className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-amber-400/30 bg-amber-400/10 text-lg text-amber-300 transition-all duration-300 hover:scale-110 hover:bg-amber-400/20 hover:shadow-lg hover:shadow-amber-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <Tooltip label="Support Politeia" />
        <span aria-hidden="true">☕</span>
      </a>

      <button
        type="button"
        aria-label="Venmo coming soon"
        title="Venmo coming soon"
        className="group relative flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-blue-500/30 bg-blue-500/10 text-sm font-bold text-blue-400 transition-all duration-300 hover:scale-110 hover:bg-blue-500/20 hover:shadow-lg hover:shadow-blue-500/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
      >
        <Tooltip label="Venmo coming soon" />
        <span aria-hidden="true">V</span>
      </button>
    </div>
  );
}
