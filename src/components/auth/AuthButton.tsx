"use client"

import { useState, useRef, useEffect } from "react"
import { useUser } from "./UserProvider"
import { generateUsername } from "@/lib/user"

export function AuthButton() {
  const { user, login, logout, updateUser } = useUser()
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"menu" | "create" | "edit">("menu")
  const [displayName, setDisplayName] = useState("")
  const [username, setUsername] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")
  const [error, setError] = useState("")
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setMode("menu")
        setError("")
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function openCreate() {
    setDisplayName("")
    setUsername("")
    setAvatarUrl("")
    setError("")
    setMode("create")
  }

  function openEdit() {
    if (!user) return
    setDisplayName(user.displayName)
    setUsername(user.username)
    setAvatarUrl(user.avatarUrl ?? "")
    setError("")
    setMode("edit")
  }

  function handleCreate() {
    const name = displayName.trim()
    if (!name) { setError("Display name is required."); return }
    if (name.length > 40) { setError("Display name must be 40 characters or fewer."); return }
    const uname = username.trim() || generateUsername(name)
    login({
      displayName: name,
      username: uname,
      avatarUrl: avatarUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
    })
    setOpen(false)
    setMode("menu")
  }

  function handleEdit() {
    const name = displayName.trim()
    if (!name) { setError("Display name is required."); return }
    updateUser({
      displayName: name,
      username: username.trim() || user?.username,
      avatarUrl: avatarUrl.trim() || undefined,
    })
    setOpen(false)
    setMode("menu")
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => { setOpen((v) => !v); setMode("menu") }}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
      >
        {user ? (
          <>
            <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[11px] font-bold uppercase">
              {user.displayName.charAt(0)}
            </span>
            <span className="hidden sm:inline">{user.displayName}</span>
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Login</span>
          </>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-card shadow-lg p-4">
          {mode === "menu" && !user && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">Create a local profile</p>
              <p className="text-[12px] text-muted-foreground">
                No password required. Comments and profile are stored locally in this prototype.
              </p>
              <button
                onClick={openCreate}
                className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Create Profile
              </button>
            </div>
          )}

          {mode === "menu" && user && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold uppercase">
                  {user.displayName.charAt(0)}
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{user.displayName}</p>
                  <p className="text-[12px] text-muted-foreground">@{user.username}</p>
                </div>
              </div>
              <button
                onClick={openEdit}
                className="w-full py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors"
              >
                Edit Profile
              </button>
              <button
                onClick={() => { logout(); setOpen(false) }}
                className="w-full py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
              >
                Sign Out
              </button>
            </div>
          )}

          {(mode === "create" || mode === "edit") && (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-foreground">
                {mode === "create" ? "Create Profile" : "Edit Profile"}
              </p>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">Display Name *</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  maxLength={40}
                />
              </div>
              <div>
                <label className="text-[12px] text-muted-foreground block mb-1">Username</label>
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="auto-generated if blank"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  maxLength={30}
                />
              </div>
              {error && <p className="text-[12px] text-destructive">{error}</p>}
              <div className="flex gap-2">
                <button
                  onClick={() => { setMode("menu"); setError("") }}
                  className="flex-1 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={mode === "create" ? handleCreate : handleEdit}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
