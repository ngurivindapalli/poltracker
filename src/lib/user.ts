// Local user account model + storage helpers.
//
// This is a localStorage-only prototype. The helper functions below are
// intentionally framework-agnostic so the storage layer can later be swapped
// for Supabase / Firebase / Auth.js without changing the component code.

export interface UserProfile {
  id: string
  displayName: string
  username: string
  avatarUrl?: string
  createdAt: string
}

export interface CreateLocalUserInput {
  displayName: string
  username?: string
  avatarUrl?: string
}

export const USER_STORAGE_KEY = "poltracker-user-profile"

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<UserProfile>
    if (!parsed || !parsed.displayName || !parsed.username) return null
    // Backfill fields that may be missing from older prototype data.
    return {
      id: parsed.id ?? generateId(),
      displayName: parsed.displayName,
      username: normalizeUsername(parsed.username),
      avatarUrl: parsed.avatarUrl,
      createdAt: parsed.createdAt ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}

export function saveStoredUser(user: UserProfile): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user))
}

export function clearStoredUser(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function normalizeUsername(username: string): string {
  return username
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 30)
}

/**
 * Builds a validated UserProfile from raw input.
 * Returns an `{ error }` object when validation fails so the UI can show it.
 */
export function createLocalUser(
  input: CreateLocalUserInput
): UserProfile | { error: string } {
  const displayName = input.displayName.trim()
  if (!displayName) return { error: "Display name is required." }
  if (displayName.length > 40)
    return { error: "Display name must be 40 characters or fewer." }

  const rawUsername = input.username?.trim()
    ? input.username
    : displayName
  const username = normalizeUsername(rawUsername)
  if (!username) return { error: "Username is required." }

  const avatarUrl = input.avatarUrl?.trim() || undefined

  return {
    id: generateId(),
    displayName,
    username,
    avatarUrl,
    createdAt: new Date().toISOString(),
  }
}

function generateId(): string {
  return `usr_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}
