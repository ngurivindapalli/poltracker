"use client"

import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { SUPABASE_URL, SUPABASE_ANON_KEY, hasSupabaseConfig } from "./config"

let browserClient: SupabaseClient | null = null

/**
 * Returns a memoized Supabase browser client, or `null` when the Supabase
 * environment variables are not configured. Callers must handle the null case
 * so the app keeps working with the localStorage fallback.
 */
export function createClient(): SupabaseClient | null {
  if (!hasSupabaseConfig()) return null
  if (browserClient) return browserClient

  browserClient = createBrowserClient(SUPABASE_URL as string, SUPABASE_ANON_KEY as string)
  return browserClient
}
