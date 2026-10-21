import { getRepresentativeSummaries } from "@/lib/representatives/summaries";
import { getSenatorSummaries } from "@/lib/senators/summaries";
import { CHAT_MEMBER_INDEX_CACHE_MS } from "./config";
import { extractStateFromText, normalizeStateCode } from "./states";
import type { ChatMember } from "./types";

type MemberCache = { at: number; members: ChatMember[] };

let memberCache: MemberCache | null = null;

function profilePath(chamber: string, bioguideId: string): string {
  return chamber === "house"
    ? `/representatives/${bioguideId}`
    : `/senator/${bioguideId}`;
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function loadChatMembers(): Promise<ChatMember[]> {
  const now = Date.now();
  if (memberCache && now - memberCache.at < CHAT_MEMBER_INDEX_CACHE_MS) {
    return memberCache.members;
  }
  const [senate, house] = await Promise.all([
    getSenatorSummaries().catch(() => ({ senators: [] as never[] })),
    getRepresentativeSummaries().catch(() => ({
      representatives: [] as never[],
    })),
  ]);
  const members: ChatMember[] = [];
  for (const row of senate.senators || []) {
    members.push({
      bioguideId: row.bioguideId,
      name: row.name,
      firstName: row.firstName,
      lastName: row.lastName,
      party: row.party,
      state: row.state,
      district: null,
      chamber: "senate",
      estimatedNetWorth: row.estimatedNetWorth,
      tradeCount: row.tradeCount,
      tradeVolume: row.tradeVolume,
      latestTradeDate: row.latestTradeDate,
      financialUpdated: row.latestFinancialUpdate,
      dataUpdatedAt: row.dataUpdatedAt,
      profilePath: profilePath("senate", row.bioguideId),
    });
  }
  for (const row of house.representatives || []) {
    members.push({
      bioguideId: row.bioguideId,
      name: row.name,
      firstName: row.firstName,
      lastName: row.lastName,
      party: row.party,
      state: row.state,
      district: row.district,
      chamber: "house",
      estimatedNetWorth: row.estimatedNetWorth,
      tradeCount: row.tradeCount,
      tradeVolume: row.tradeVolume,
      latestTradeDate: row.latestTradeDate,
      financialUpdated: row.latestFinancialUpdate,
      dataUpdatedAt: row.dataUpdatedAt,
      profilePath: profilePath("house", row.bioguideId),
    });
  }
  memberCache = { at: now, members };
  return members;
}

export function resetChatMemberCache(): void {
  memberCache = null;
}

const LAST_NAME_STOPWORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "from",
  "this",
  "that",
  "what",
  "when",
  "status",
  "bill",
  "bills",
  "senate",
  "house",
  "about",
  "current",
  "recent",
  "news",
  "worth",
  "member",
  "congress",
]);

function scoreMember(query: string, member: ChatMember): number {
  const q = normalize(query);
  if (!q) return 0;
  const name = normalize(member.name || "");
  const last = normalize(member.lastName || name.split(" ").slice(-1)[0] || "");
  const first = normalize(
    member.firstName ||
      name
        .split(" ")
        .filter((part) => part && part.length > 1 && part !== last)[0] ||
      ""
  );
  const full = `${first} ${last}`.trim();
  let score = 0;
  if (name && name.length > 4 && q.includes(name)) score += 12;
  if (full && first && last && q.includes(full)) score += 10;
  if (last && last.length > 3 && !LAST_NAME_STOPWORDS.has(last)) {
    const titled = new RegExp(
      `\\b(senator|sen|rep|representative|congress(?:wo)?man)\\s+${last}\\b`
    );
    const lastRe = new RegExp(`\\b${last}\\b`);
    if (titled.test(q)) score += 8;
    else if (first && new RegExp(`\\b${first}\\s+${last}\\b`).test(q)) score += 8;
    else if (last.length >= 6 && lastRe.test(q)) score += 6;
  }
  if (member.bioguideId && q.includes(member.bioguideId.toLowerCase())) {
    score += 15;
  }
  return score;
}

export function matchChatMembers(
  message: string,
  members: ChatMember[],
  opts: { bioguideId?: string; state?: string; mySenator?: boolean }
): ChatMember[] {
  if (opts.bioguideId) {
    const exact = members.find(
      (m) => m.bioguideId.toUpperCase() === opts.bioguideId
    );
    if (exact) return [exact];
  }

  const state =
    normalizeStateCode(opts.state) || extractStateFromText(message);
  const scored = members
    .map((member) => ({ member, score: scoreMember(message, member) }))
    .filter((row) => row.score >= 6)
    .sort((a, b) => b.score - a.score);

  if (/\b(?:h\.?\s*r\.?|s)\.?\s*\d{1,6}\b/i.test(message) && !opts.bioguideId) {
    const named = scored.filter((row) => row.score >= 10);
    if (named.length) {
      return named.slice(0, 3).map((row) => row.member);
    }
    if (scored.length === 0) {
      /* continue to state matching below */
    } else if (!extractStateFromText(message) && !opts.state) {
      return [];
    }
  }

  if (scored.length > 0) {
    const top = scored[0].score;
    return scored
      .filter((row) => row.score >= Math.max(6, top - 3))
      .slice(0, 3)
      .map((row) => row.member);
  }

  if (
    state &&
    (opts.mySenator ||
      /\b(my senator|our senator|the senators?|in the senate|senators? from|represents)\b/i.test(
        message
      ))
  ) {
    const senators = members.filter(
      (m) => m.chamber === "senate" && m.state === state
    );
    if (senators.length) return senators.slice(0, 2);
  }

  if (/\b(my representative|my congressman|my congresswoman)\b/i.test(message) && state) {
    return members
      .filter((m) => m.chamber === "house" && m.state === state)
      .slice(0, 3);
  }

  return [];
}
