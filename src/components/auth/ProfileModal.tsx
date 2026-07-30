"use client"

import { useEffect, useState } from "react"
import { useUser } from "./UserProvider"

interface ProfileModalProps {
  open: boolean
  mode: "create" | "edit"
  onClose: () => void
}

/**
 * Modal for creating or editing the local user profile.
 * No password — this is a localStorage prototype account.
 */
export function ProfileModal({ open, mode, onClose }: ProfileModalProps) {
  const { user, createUser, updateUser } = useUser()
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (!open) return
    setError("")
    if (mode === "edit" && user) {
      setDisplayName(user.displayName)
      setUsername(user.username)
      setAvatarUrl(user.avatarUrl ?? "")
    } else {
      setDisplayName("")
      setUsername("")
      setAvatarUrl("")
    }
  }, [open, mode, user])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    if (open) document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [open, onClose])

  if (!open) return null

  function handleSubmit() {
    setError("")
    const input = {
      displayName,
      username,
      avatarUrl: avatarUrl.trim() || undefined,
    }
    const result = mode === "create" ? createUser(input) : updateUser(input)
    if (result?.error) {
      setError(result.error)
      return
    }
    onClose()
  }

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
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-elevated">
        <div className="flex items-start justify-between mb-1">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "create" ? "Create Account" : "Edit Profile"}
          </h2>
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
          No password required. Your profile is stored locally in this prototype.
        </p>

        <div className="space-y-4">
          <div>
            <label className="text-[12px] font-medium text-muted-foreground block mb-1">
              Display Name <span className="text-destructive">*</span>
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              maxLength={40}
              autoFocus
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          <div>
            <label className="text-[12px] font-medium text-muted-foreground block mb-1">
              Username <span className="text-destructive">*</span>
            </label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="auto-generated from name if blank"
              maxLength={30}
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Lowercase letters, numbers and underscores only.
            </p>
          </div>

          <div>
            <label className="text-[12px] font-medium text-muted-foreground block mb-1">
              Avatar URL <span className="text-muted-foreground/60">(optional)</span>
            </label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://..."
              className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {error && <p className="text-[12px] text-destructive">{error}</p>}

          <div className="flex gap-2 pt-1">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {mode === "create" ? "Create Account" : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
