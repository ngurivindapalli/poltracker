import { MAX_COMMENT_LENGTH, MAX_ENTITY_KEY_LENGTH } from "./constants";

const ENTITY_PATTERN = /^[A-Za-z0-9._:-]+$/;

export function validateCommentBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return "Comment cannot be empty.";
  if (trimmed.length > MAX_COMMENT_LENGTH) {
    return `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer.`;
  }
  return null;
}

export function validateEntityKey(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > MAX_ENTITY_KEY_LENGTH) {
    return `${label} is too long.`;
  }
  if (!ENTITY_PATTERN.test(trimmed)) return `${label} is invalid.`;
  return null;
}

export function sanitizeCommentBody(body: string): string {
  return body.trim().slice(0, MAX_COMMENT_LENGTH);
}
