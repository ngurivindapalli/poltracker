"use client"

import { useEffect, useRef, useState } from "react"
import { useAuth } from "./AuthProvider"
import type { Profile } from "@/types/supabase"

interface ProfileMenuProps {
  profile: Profile
  onEditProfile: () => void
}

export function ProfileMenu({ profile, onEditProfile }: ProfileMenuProps) {
  const { signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  const label = profile.display_name || profile.username || "Account"

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-slate-300 hover:text-white transition-colors px-2 py-1.5 rounded-lg hover:bg-white/5"
      >
        <Avatar displayName={label} avatarUrl={profile.avatar_url} size={26} />
        <span className="hidden sm:inline max-w-[120px] truncate">{label}</span>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-64 rounded-xl border border-border bg-card shadow-elevated p-4">
          <div className="flex items-center gap-3 mb-3">
            <Avatar displayName={label} avatarUrl={profile.avatar_url} size={40} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {profile.display_name}
              </p>
              {profile.username && (
                <p className="text-[12px] text-muted-foreground truncate">
                  @{profile.username}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={() => {
              setOpen(false)
              onEditProfile()
            }}
            className="w-full py-2 rounded-lg border border-border text-sm text-foreground hover:bg-muted transition-colors mb-2"
          >
            Edit Profile
          </button>
          <button
            onClick={() => {
              void signOut()
              setOpen(false)
            }}
            className="w-full py-2 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  )
}

function Avatar({
  displayName,
  avatarUrl,
  size,
}: {
  displayName: string
  avatarUrl: string | null
  size: number
}) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt={displayName}
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
      {displayName.charAt(0)}
    </span>
  )
}
