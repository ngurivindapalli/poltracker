// Legacy Supabase helpers. Account sign-in and comments now use NextAuth and
// PostgreSQL. These checks remain so unused clients stay inert without env vars.

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

/**
 * True when both Supabase env vars are present and non-empty.
 * Safe to call on the server or in the browser.
 */
export function hasSupabaseConfig(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY)
}
