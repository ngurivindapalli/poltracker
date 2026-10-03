import Link from "next/link";
import SenatorImage from "@/components/SenatorImage";
import { formatUsdCompact, partyKind } from "@/lib/format";
import { STATE_CODE_TO_NAME } from "@/lib/localData/usCounties";

const NAME_TO_CODE: Record<string, string> = Object.fromEntries(
  Object.entries(STATE_CODE_TO_NAME).map(([code, name]) => [
    name.toUpperCase(),
    code,
  ])
);

function toStateCode(raw?: string | null): string {
  if (!raw) return "";
  const value = raw.trim().toUpperCase();
  if (value.length === 2) return value;
  return NAME_TO_CODE[value] || value;
}

export type CongressMemberCardData = {
  bioguideId: string;
  name: string;
  party?: string | null;
  state?: string | null;
  district?: string | number | null;
  imageUrl?: string | null;
  chamber?: "senate" | "house" | string | null;
  estimatedNetWorth?: number | null;
  tradeCount?: number | null;
};

function partyText(party?: string | null): string {
  const kind = partyKind(party);
  if (kind === "democrat") return "Democratic";
  if (kind === "republican") return "Republican";
  if (kind === "independent") return "Independent";
  return party?.trim() || "—";
}

function jurisdiction(member: CongressMemberCardData): string {
  const state = toStateCode(member.state);
  if (!state) return "—";
  const house = (member.chamber || "").toLowerCase() === "house";
  const raw = member.district == null ? "" : String(member.district).trim();
  if (!house || !raw) return state;
  const lower = raw.toLowerCase();
  if (lower === "0" || lower.includes("at") || lower === "al") return state;
  return `${state}-${raw}`;
}

function profileHref(member: CongressMemberCardData): string {
  const id = member.bioguideId;
  return (member.chamber || "").toLowerCase() === "house"
    ? `/representatives/${id}`
    : `/senator/${id}`;
}

function tradeLine(count?: number | null): string {
  if (count == null || count <= 0) return "\u00a0";
  return count === 1 ? "1 disclosed trade" : `${count} disclosed trades`;
}

export function CongressMemberCard({ member }: { member: CongressMemberCardData }) {
  const worth =
    member.estimatedNetWorth == null || Number.isNaN(member.estimatedNetWorth)
      ? "Unavailable"
      : formatUsdCompact(member.estimatedNetWorth);

  return (
    <Link
      href={profileHref(member)}
      className="interactive-card group flex h-full flex-col items-center p-5 text-center"
    >
      <SenatorImage
        bioguideId={member.bioguideId}
        imageUrl={member.imageUrl || undefined}
        name={member.name}
        width={96}
        height={96}
      />
      <h3 className="mt-4 text-[15px] font-semibold leading-snug text-foreground group-hover:underline">
        {member.name}
      </h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {partyText(member.party)} · {jurisdiction(member)}
      </p>
      <div className="mt-4 w-full flex-1 border-t border-border pt-3">
        <div className="label-caps">Estimated net worth</div>
        <div className="stat-num mt-0.5 text-lg">{worth}</div>
        <p className="mt-1 min-h-4 text-xs text-muted-foreground">
          {tradeLine(member.tradeCount)}
        </p>
      </div>
    </Link>
  );
}
