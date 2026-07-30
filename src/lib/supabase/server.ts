import { cookies } from "next/headers"
import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseConfig } from "./config"

/**
 * Creates a Supabase client for App Router server components, route handlers,
 * and server actions. Returns `null` when Supabase is not configured.
 *
 * Cookie writes are wrapped in try/catch because Next.js disallows mutating
 * cookies from a Server Component render; in that context the middleware /
 * client handles session refresh instead.
 */
export function createClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null

  const cookieStore = cookies()

  return createServerClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // Called from a Server Component render — safe to ignore.
        }
      },
    },
  })
}
