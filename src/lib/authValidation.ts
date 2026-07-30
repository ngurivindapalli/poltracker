// Client-side validation for the Supabase auth + profile forms.

export const USERNAME_PATTERN = /^[a-z0-9_-]+$/

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

/** Lowercases and strips characters that are not allowed in a username. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase().replace(/[^a-z0-9_-]/g, "").slice(0, 30)
}

interface ProfileFields {
  displayName: string
  username: string
}

/** Validates display name + username. Returns an error string or null. */
export function validateProfileFields({
  displayName,
  username,
}: ProfileFields): string | null {
  if (!displayName.trim()) return "Display name is required."
  if (displayName.trim().length > 40)
    return "Display name must be 40 characters or fewer."

  const u = username.trim()
  if (!u) return "Username is required."
  if (!USERNAME_PATTERN.test(u))
    return "Username may only contain lowercase letters, numbers, underscores, and hyphens."
  if (u.length > 30) return "Username must be 30 characters or fewer."
  return null
}

/** Validates email + password for sign up / log in. Returns an error or null. */
export function validateCredentials(email: string, password: string): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address."
  if (password.length < 6) return "Password must be at least 6 characters."
  return null
}
