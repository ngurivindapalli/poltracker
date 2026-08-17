"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

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
            <div className="space-y-2 py-4" aria-busy="true">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-24 w-full" />
            </div>
          )}
    </div>
  );
}
