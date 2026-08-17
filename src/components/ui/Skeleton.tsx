import { cn } from "@/lib/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,hsl(var(--muted))_25%,hsl(var(--border))_50%,hsl(var(--muted))_75%)] bg-[length:200%_100%]",
        className
      )}
      aria-hidden
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card">
      <Skeleton className="aspect-[4/5] w-full rounded-none" />
      <div className="space-y-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="mt-3 h-6 w-24" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2" aria-busy="true">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}
