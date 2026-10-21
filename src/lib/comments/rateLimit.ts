import {
  COMMENT_RATE_LIMIT_MAX,
  COMMENT_RATE_LIMIT_WINDOW_MS,
} from "./constants";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function allowCommentWrite(userId: string): boolean {
  const now = Date.now();
  const current = buckets.get(userId);
  if (!current || now >= current.resetAt) {
    buckets.set(userId, {
      count: 1,
      resetAt: now + COMMENT_RATE_LIMIT_WINDOW_MS,
    });
    return true;
  }
  if (current.count >= COMMENT_RATE_LIMIT_MAX) return false;
  current.count += 1;
  return true;
}

export function resetCommentRateLimit(): void {
  buckets.clear();
}
