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
    <div className="flex h-full flex-col items-center rounded-lg border border-border bg-card p-5">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="mt-4 h-5 w-3/4" />
      <Skeleton className="mt-2 h-4 w-1/2" />
      <div className="mt-4 w-full border-t border-border pt-3">
        <Skeleton className="mx-auto h-3 w-32" />
        <Skeleton className="mx-auto mt-2 h-6 w-16" />
        <Skeleton className="mx-auto mt-2 h-3 w-24" />
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
