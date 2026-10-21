import {
  CHAT_MAX_HISTORY_CHARS,
  CHAT_MAX_HISTORY_MESSAGES,
  CHAT_MAX_MESSAGE_CHARS,
} from "./limits";
import type { ChatHistoryMessage, ChatRequestBody } from "./types";

const BIOGUIDE = /^[A-Za-z][0-9]{6}$/;
const STATE = /^[A-Za-z]{2}$/;

export function validateChatRequest(input: unknown): {
  value?: ChatRequestBody;
  error?: string;
} {
  if (!input || typeof input !== "object") {
    return { error: "Send a JSON object with a message." };
  }
  const body = input as Record<string, unknown>;
  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message) return { error: "Please provide a message." };
  if (message.length > CHAT_MAX_MESSAGE_CHARS) {
    return {
      error: `Keep questions under ${CHAT_MAX_MESSAGE_CHARS} characters.`,
    };
  }

  let bioguideId: string | undefined;
  if (body.bioguideId != null) {
    if (typeof body.bioguideId !== "string" || !BIOGUIDE.test(body.bioguideId.trim())) {
      return { error: "That member id is not valid." };
    }
    bioguideId = body.bioguideId.trim().toUpperCase();
  }

  let state: string | undefined;
  if (body.state != null) {
    if (typeof body.state !== "string" || !STATE.test(body.state.trim())) {
      return { error: "Use a two-letter state code." };
    }
    state = body.state.trim().toUpperCase();
  }

  const history = sanitizeHistory(body.history);
  return { value: { message, bioguideId, state, history } };
}

export function sanitizeHistory(raw: unknown): ChatHistoryMessage[] {
  if (!Array.isArray(raw)) return [];
  const out: ChatHistoryMessage[] = [];
  for (const item of raw.slice(-CHAT_MAX_HISTORY_MESSAGES)) {
    if (!item || typeof item !== "object") continue;
    const role = (item as { role?: unknown }).role;
    const content = (item as { content?: unknown }).content;
    if (role !== "user" && role !== "assistant") continue;
    if (typeof content !== "string") continue;
    const text = content.trim().slice(0, CHAT_MAX_HISTORY_CHARS);
    if (!text) continue;
    out.push({ role, content: text });
  }
  return out;
}

export function looksLikeInjection(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    /ignore (all|your|previous|prior)?\s*(instructions|rules|prompt)/.test(lower) ||
    /you are now|jailbreak|developer mode/.test(lower) ||
    /invent (a )?(scandal|crime|allegation)/.test(lower) ||
    /make up (evidence|votes|trades|a scandal)/.test(lower) ||
    /pretend (the )?(records|database) (don't|do not|does not)/.test(lower)
  );
}
