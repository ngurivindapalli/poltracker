import type { ChatErrorCode, ChatResponseBody } from "./types";

export function chatErrorResponse(
  code: ChatErrorCode,
  answer: string,
  retryable = false
): ChatResponseBody {
  return { answer, error: code, retryable, unverified: code !== "invalid" };
}

export function mapProviderError(err: unknown): ChatResponseBody {
  const status =
    typeof err === "object" && err && "status" in err
      ? Number((err as { status?: number }).status)
      : 0;
  const message =
    typeof err === "object" && err && "message" in err
      ? String((err as { message?: string }).message || "")
      : "";
  const lower = message.toLowerCase();

  if (status === 429 || lower.includes("rate limit") || lower.includes("429")) {
    return chatErrorResponse(
      "rate_limited",
      "The research assistant is temporarily rate limited. Try again in a minute.",
      true
    );
  }
  if (
    status === 413 ||
    lower.includes("quota") ||
    lower.includes("tokens per day") ||
    lower.includes("insufficient")
  ) {
    return chatErrorResponse(
      "quota",
      "The research assistant has reached its current usage limit. Try again later.",
      true
    );
  }
  if (status === 401 || status === 403) {
    return chatErrorResponse(
      "unconfigured",
      "The research assistant is not configured on this deployment.",
      false
    );
  }
  return chatErrorResponse(
    "unavailable",
    "The research assistant is temporarily unavailable. Please try again.",
    true
  );
}
