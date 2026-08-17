import { cn } from "@/lib/cn";

export function SourceBadge({
  source,
  className,
}: {
  source: string;
  className?: string;
}) {
  return (
    <p className={cn("text-[11px] text-muted-foreground", className)}>
      Source: <span className="font-medium text-foreground/80">{source}</span>
    </p>
  );
}
