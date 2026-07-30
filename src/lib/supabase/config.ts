// Centralized Supabase configuration checks.
//
// Cloud accounts + comments are optional: if the environment variables are not
// present the app gracefully falls back to the localStorage prototype. Every
// Supabase entry point should consult these helpers before doing any work.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * True when both Supabase env vars are present and non-empty.
 * Safe to call on the server or in the browser.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
