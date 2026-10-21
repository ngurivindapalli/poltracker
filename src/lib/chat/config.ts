import {
  CHAT_DAILY_MAX_ANON,
  CHAT_DAILY_MAX_USER,
  CHAT_DAILY_WINDOW_MS,
  CHAT_GLOBAL_MAX_PER_MINUTE,
  CHAT_MAX_HISTORY_CHARS,
  CHAT_MAX_HISTORY_MESSAGES,
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_RATE_LIMIT_MAX_ANON,
  CHAT_RATE_LIMIT_MAX_USER,
  CHAT_RATE_LIMIT_WINDOW_MS,
} from "./limits";

export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";
export const GROQ_CHAT_MODEL = "openai/gpt-oss-120b";
export const GROQ_TIMEOUT_MS = 25_000;
export const GROQ_MAX_OUTPUT_TOKENS = 700;
export const GROQ_TEMPERATURE = 0.2;

export {
  CHAT_DAILY_MAX_ANON,
  CHAT_DAILY_MAX_USER,
  CHAT_DAILY_WINDOW_MS,
  CHAT_GLOBAL_MAX_PER_MINUTE,
  CHAT_MAX_HISTORY_CHARS,
  CHAT_MAX_HISTORY_MESSAGES,
  CHAT_MAX_MESSAGE_CHARS,
  CHAT_RATE_LIMIT_MAX_ANON,
  CHAT_RATE_LIMIT_MAX_USER,
  CHAT_RATE_LIMIT_WINDOW_MS,
};

export const CHAT_RETRIEVAL_CACHE_MS = 2 * 60 * 1000;
export const CHAT_MEMBER_INDEX_CACHE_MS = 5 * 60 * 1000;

export function getGroqApiKey(): string | null {
  const key = process.env.GROQ_API_KEY?.trim();
  return key ? key : null;
}

export function isChatConfigured(): boolean {
  return Boolean(getGroqApiKey());
}
