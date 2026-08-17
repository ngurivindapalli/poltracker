import { cn } from "@/lib/cn";
import { partyKind, partyLabel } from "@/lib/format";

export function PartyBadge({
  party,
  className,
}: {
  party?: string | null;
  className?: string;
}) {
  const kind = partyKind(party);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
        kind === "democrat" && "bg-party-d/10 text-party-d",
        kind === "republican" && "bg-party-r/10 text-party-r",
        kind === "independent" && "bg-party-i/10 text-party-i",
        kind === "unknown" && "bg-muted text-muted-foreground",
        className
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          kind === "democrat" && "bg-party-d",
          kind === "republican" && "bg-party-r",
          kind === "independent" && "bg-party-i",
          kind === "unknown" && "bg-muted-foreground"
        )}
        aria-hidden
      />
      {partyLabel(party)}
    </span>
  );
}
