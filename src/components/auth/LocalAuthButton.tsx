"use client"

import { useState, useRef, useEffect } from "react"
import { useUser } from "./UserProvider"
import { ProfileModal } from "./ProfileModal"

/**
 * localStorage prototype account button. Used as a fallback only when Supabase
 * environment variables are not configured.
 */
export function LocalAuthButton() {
  const { user, ready, logout } = useUser()
  const [menuOpen, setMenuOpen] = useState(false)
  const [modalMode, setModalMode] = useState<"create" | "edit" | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  // Avoid a hydration flash before localStorage is read.
  if (!ready) {
    return <div className="w-[120px] h-9" aria-hidden />
  }

  return (
    <>
      <div className="relative" ref={ref}>
        {user ? (
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1.5 rounded-lg hover:bg-muted"
          >
            <Avatar user={user} size={24} />
            <span className="hidden sm:inline max-w-[120px] truncate">
              {user.displayName}
            </span>
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        ) : (
          <button
            onClick={() => setModalMode("create")}
            className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>Create Account</span>
          </button>
        )}

        {menuOpen && user && (
          <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-card shadow-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              <Avatar user={user} size={40} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user.displayName}</p>
                <p className="text-[12px] text-muted-foreground truncate">@{user.username}</p>
              </div>
            </div>
            <button
              onClick={() => {
                setMenuOpen(false)
                setModalMode("edit")
              }}
              className="w-full py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors mb-2"
            >
              Edit Profile
            </button>
            <button
              onClick={() => {
                logout()
                setMenuOpen(false)
              }}
              className="w-full py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
            >
              Log Out
            </button>
          </div>
        )}
      </div>

      <ProfileModal
        open={modalMode !== null}
        mode={modalMode ?? "create"}
        onClose={() => setModalMode(null)}
      />
    </>
  )
}

function Avatar({
  user,
  size,
}: {
  user: { displayName: string; avatarUrl?: string }
  size: number
}) {
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={user.displayName}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <span
      className="rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold uppercase shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {user.displayName.charAt(0)}
    </span>
  )
}
