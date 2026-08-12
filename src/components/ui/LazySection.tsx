"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * Defer mounting children until near viewport — keeps secondary financial
 * sections from firing fetch() on initial page open.
 */
export default function LazySection({
  children,
  fallback,
  rootMargin = "280px",
  minHeight = 120,
}: {
  children: ReactNode;
  fallback?: ReactNode;
  rootMargin?: string;
  minHeight?: number;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, visible]);

  return (
    <div ref={ref} style={{ minHeight: visible ? undefined : minHeight }}>
      {visible
        ? children
        : fallback ?? (
            <div className="text-sm text-[#94A3B8] py-8 text-center">
              Scroll to load…
            </div>
          )}
    </div>
  );
}
