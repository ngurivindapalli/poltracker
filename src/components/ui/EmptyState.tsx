import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/Button";

export function EmptyState({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border bg-muted/40 px-6 py-10 text-center",
        className
      )}
    >
      <p className="font-medium text-foreground">{title}</p>
      {description ? (
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

export function ErrorState({
  title = "This section is temporarily unavailable.",
  description = "Public source data could not be loaded. Other information on this page may still be available.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-6 py-8 text-center",
        className
      )}
      role="alert"
    >
      <p className="font-medium text-foreground">{title}</p>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
        {description}
      </p>
      {onRetry ? (
        <Button variant="outline" size="sm" className="mt-4" onClick={onRetry}>
          Retry
        </Button>
      ) : null}
    </div>
  );
}
