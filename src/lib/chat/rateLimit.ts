import {
  CHAT_DAILY_MAX_ANON,
  CHAT_DAILY_MAX_USER,
  CHAT_DAILY_WINDOW_MS,
  CHAT_GLOBAL_MAX_PER_MINUTE,
  CHAT_RATE_LIMIT_MAX_ANON,
  CHAT_RATE_LIMIT_MAX_USER,
  CHAT_RATE_LIMIT_WINDOW_MS,
} from "./limits";

type Bucket = { count: number; resetAt: number };

const minuteBuckets = new Map<string, Bucket>();
const dayBuckets = new Map<string, Bucket>();
const globalMinute: Bucket = { count: 0, resetAt: 0 };

function hit(map: Map<string, Bucket>, key: string, max: number, windowMs: number, now: number) {
  const current = map.get(key);
  if (!current || now >= current.resetAt) {
    map.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (current.count >= max) return false;
  current.count += 1;
  return true;
}

export function allowChatRequest(input: {
  key: string;
  authenticated: boolean;
  now?: number;
}): boolean {
  const now = input.now ?? Date.now();
  if (!globalMinute.resetAt || now >= globalMinute.resetAt) {
    globalMinute.count = 0;
    globalMinute.resetAt = now + CHAT_RATE_LIMIT_WINDOW_MS;
  }
  if (globalMinute.count >= CHAT_GLOBAL_MAX_PER_MINUTE) return false;
  globalMinute.count += 1;

  const perMin = input.authenticated
    ? CHAT_RATE_LIMIT_MAX_USER
    : CHAT_RATE_LIMIT_MAX_ANON;
  const perDay = input.authenticated ? CHAT_DAILY_MAX_USER : CHAT_DAILY_MAX_ANON;
  if (!hit(minuteBuckets, input.key, perMin, CHAT_RATE_LIMIT_WINDOW_MS, now)) {
    return false;
  }
  return hit(dayBuckets, `day:${input.key}`, perDay, CHAT_DAILY_WINDOW_MS, now);
}

export function chatRateLimitKey(req: Request, userId?: string | null): string {
  if (userId) return `user:${userId}`;
  const forwarded = req.headers.get("x-forwarded-for") || "";
  const ip =
    forwarded.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "anon";
  return `ip:${ip.slice(0, 64)}`;
}

export function resetChatRateLimit(): void {
  minuteBuckets.clear();
  dayBuckets.clear();
  globalMinute.count = 0;
  globalMinute.resetAt = 0;
}
