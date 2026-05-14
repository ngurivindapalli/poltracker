export interface UserProfile {
  displayName: string
  username: string
  avatarUrl?: string
  createdAt: string
}

export const USER_STORAGE_KEY = "poltracker-user-profile"

export function getStoredUser(): UserProfile | null {
  if (typeof window === "undefined") return null
  try {
    const raw = window.localStorage.getItem(USER_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export function saveUser(profile: UserProfile): void {
  if (typeof window === "undefined") return
  window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(profile))
}

export function clearUser(): void {
  if (typeof window === "undefined") return
  window.localStorage.removeItem(USER_STORAGE_KEY)
}

export function generateUsername(displayName: string): string {
  return displayName
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20)
}
