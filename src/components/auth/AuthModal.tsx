"use client"

import { useEffect, useState } from "react"
import { useAuth } from "./AuthProvider"
import {
  normalizeUsername,
  validateCredentials,
  validateProfileFields,
} from "@/lib/authValidation"

export type AuthModalMode = "signup" | "login" | "edit"

interface AuthModalProps {
  open: boolean
  mode: AuthModalMode
  onClose: () => void
  onModeChange: (mode: AuthModalMode) => void
}

const inputClass =
  "w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
const labelClass = "text-[12px] font-medium text-muted-foreground block mb-1"

export function AuthModal({ open, mode, onClose, onModeChange }: AuthModalProps) {
  const { signUp, signIn, updateProfile, profile } = useAuth()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [submitting, setSubmitting] = useState(false)

  // Reset / hydrate fields whenever the modal opens or the mode changes.
  useEffect(() => {
    if (!open) return
    setError("")
    setNotice("")
    setSubmitting(false)
    if (mode === "edit" && profile) {
      setDisplayName(profile.display_name ?? "")
      setUsername(profile.username ?? "")
      setAvatarUrl(profile.avatar_url ?? "")
      setEmail("")
      setPassword("")
    } else {
      setEmail("")
      setPassword("")
      setDisplayName("")
      setUsername("")
      setAvatarUrl("")
    }
  }, [open, mode, profile])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit() {
    setError("")
    setNotice("")

    if (mode === "login") {
      const credErr = validateCredentials(email, password)
      if (credErr) return setError(credErr)
      setSubmitting(true)
      const { error } = await signIn(email.trim(), password)
      setSubmitting(false)
      if (error) return setError(error)
      onClose()
      return
    }

    if (mode === "signup") {
      const credErr = validateCredentials(email, password)
      if (credErr) return setError(credErr)
      const profileErr = validateProfileFields({ displayName, username })
      if (profileErr) return setError(profileErr)
      setSubmitting(true)
      const { error } = await signUp(email.trim(), password, {
        display_name: displayName.trim(),
        username: normalizeUsername(username),
        avatar_url: avatarUrl.trim() || null,
      })
      setSubmitting(false)
      if (error) return setError(error)
      // If email confirmation is enabled there is no session yet.
      onClose()
      return
    }

    // mode === "edit"
    const profileErr = validateProfileFields({ displayName, username })
    if (profileErr) return setError(profileErr)
    setSubmitting(true)
    const { error } = await updateProfile({
      display_name: displayName.trim(),
      username: normalizeUsername(username),
      avatar_url: avatarUrl.trim() || null,
    })
    setSubmitting(false)
    if (error) return setError(error)
    onClose()
  }

  const title =
    mode === "signup"
      ? "Create Account"
      : mode === "login"
      ? "Log In"
      : "Edit Profile"

  const submitLabel =
    mode === "signup"
      ? "Create Account"
      : mode === "login"
      ? "Log In"
      : "Save Changes"

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground transition-colors -mr-1 -mt-1 p-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-[12px] text-muted-foreground mb-5">
          {mode === "login"
            ? "Log in to your cloud account to join the discussion."
            : mode === "signup"
            ? "Create a cloud account. Your comments sync across devices."
            : "Update how you appear across Politeia."}
        </p>

        <div className="space-y-4">
          {(mode === "signup" || mode === "login") && (
            <>
              <div>
                <label className={labelClass}>
                  Email <span className="text-destructive">*</span>
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Password <span className="text-destructive">*</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  className={inputClass}
                />
              </div>
            </>
          )}

          {(mode === "signup" || mode === "edit") && (
            <>
              <div>
                <label className={labelClass}>
                  Display Name <span className="text-destructive">*</span>
                </label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  maxLength={40}
                  autoFocus={mode === "edit"}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  Username <span className="text-destructive">*</span>
                </label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase())}
                  placeholder="username"
                  maxLength={30}
                  className={inputClass}
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Lowercase letters, numbers, underscores, and hyphens only.
                </p>
              </div>
              <div>
                <label className={labelClass}>
                  Avatar URL <span className="text-muted-foreground/60">(optional)</span>
                </label>
                <input
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className={inputClass}
                />
              </div>
            </>
          )}

          {error && <p className="text-[12px] text-destructive">{error}</p>}
          {notice && <p className="text-[12px] text-emerald-500">{notice}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Please wait..." : submitLabel}
            </button>
          </div>

          {mode === "login" && (
            <p className="text-[12px] text-muted-foreground text-center">
              No account?{" "}
              <button
                onClick={() => onModeChange("signup")}
                className="text-primary font-medium hover:underline"
              >
                Create one
              </button>
            </p>
          )}
          {mode === "signup" && (
            <p className="text-[12px] text-muted-foreground text-center">
              Already have an account?{" "}
              <button
                onClick={() => onModeChange("login")}
                className="text-primary font-medium hover:underline"
              >
                Log in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
