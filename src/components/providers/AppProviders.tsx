"use client"

import React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { I18nProvider } from "@/components/i18n/I18nProvider"
import { UserProvider } from "@/components/auth/UserProvider"
import { AuthProvider } from "@/components/auth/AuthProvider"

/**
 * Single composition point for all client-side app providers.
 * Add future providers here rather than in the root layout.
 *
 * AuthProvider powers the Supabase cloud accounts. UserProvider is kept as the
 * localStorage fallback used automatically when Supabase env vars are missing.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <UserProvider>{children}</UserProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  )
}
