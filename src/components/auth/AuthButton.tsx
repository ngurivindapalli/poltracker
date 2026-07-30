"use client"

import { useState } from "react"
import { useAuth } from "./AuthProvider"
import { AuthModal, type AuthModalMode } from "./AuthModal"
import { ProfileMenu } from "./ProfileMenu"
import { LocalAuthButton } from "./LocalAuthButton"

/**
 * Header account control. Uses Supabase cloud accounts when configured, and
 * transparently falls back to the localStorage prototype account otherwise.
 */
export function AuthButton() {
  const { user, profile, loading, isConfigured } = useAuth()
  const [modalMode, setModalMode] = useState<AuthModalMode | null>(null)

  // Supabase not configured -> use the localStorage prototype account.
  if (!isConfigured) {
    return <LocalAuthButton />
  }

  // Avoid a flash while the initial session resolves.
  if (loading) {
    return <div className="w-[120px] h-9" aria-hidden />
  }

  return (
    <>
      {user && profile ? (
        <ProfileMenu profile={profile} onEditProfile={() => setModalMode("edit")} />
      ) : (
        <button
          onClick={() => setModalMode("signup")}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Create Account</span>
        </button>
      )}

      <AuthModal
        open={modalMode !== null}
        mode={modalMode ?? "signup"}
        onClose={() => setModalMode(null)}
        onModeChange={(m) => setModalMode(m)}
      />
    </>
  )
}
