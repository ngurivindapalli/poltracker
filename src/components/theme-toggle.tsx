"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <span
        className="inline-flex h-9 w-9 rounded-md border border-border"
        aria-hidden
      />
    );
  }

  const dark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-card text-foreground hover:bg-muted"
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <circle cx="12" cy="12" r="4" strokeWidth="1.75" />
          <path strokeWidth="1.75" d="M12 3v1.5M12 19.5V21M4.93 4.93l1.06 1.06M18.01 18.01l1.06 1.06M3 12h1.5M19.5 12H21M4.93 19.07l1.06-1.06M18.01 5.99l1.06-1.06" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden>
          <path strokeWidth="1.75" d="M21 14.5A8.5 8.5 0 1110.5 3 7 7 0 0021 14.5z" />
        </svg>
      )}
    </button>
  );
}
