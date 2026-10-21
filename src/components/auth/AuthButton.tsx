"use client";

import { useState } from "react";
import { useAuth } from "./AuthProvider";
import { AuthModal, type AuthModalMode } from "./AuthModal";
import { ProfileMenu } from "./ProfileMenu";

export function AuthButton() {
  const { user, profile, loading } = useAuth();
  const [modalMode, setModalMode] = useState<AuthModalMode | null>(null);

  if (loading) {
    return <div className="w-[120px] h-9" aria-hidden />;
  }

  return (
    <>
      {user && profile ? (
        <ProfileMenu profile={profile} onEditProfile={() => setModalMode("edit")} />
      ) : (
        <button
          onClick={() => setModalMode("login")}
          className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Sign in</span>
        </button>
      )}

      <AuthModal
        open={modalMode !== null}
        mode={modalMode ?? "login"}
        onClose={() => setModalMode(null)}
        onModeChange={(m) => setModalMode(m)}
      />
    </>
  );
}
