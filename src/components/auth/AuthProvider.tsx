"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import type { Profile } from "@/types/supabase";

interface AuthResult {
  error: string | null;
}

interface AuthContextValue {
  user: { id: string } | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithGoogle: (callbackUrl?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (input: { display_name: string }) => Promise<AuthResult>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  updateProfile: async () => ({ error: "Not signed in." }),
});

function profileFromSession(user: {
  id?: string;
  name?: string | null;
  image?: string | null;
}): Profile | null {
  if (!user.id) return null;
  return {
    id: user.id,
    username: null,
    display_name: user.name || "Member",
    avatar_url: user.image || null,
    created_at: "",
    updated_at: "",
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data, status } = useSession();
  const [googleConfigured, setGoogleConfigured] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/account/status")
      .then((res) => (res.ok ? res.json() : { google: false }))
      .then((payload) => {
        if (active) setGoogleConfigured(Boolean(payload.google));
      })
      .catch(() => {
        if (active) setGoogleConfigured(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setProfile(data?.user ? profileFromSession(data.user) : null);
  }, [data]);

  const signInWithGoogle = useCallback(async (callbackUrl?: string) => {
    await signIn("google", {
      callbackUrl: callbackUrl || window.location.href,
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOut({ callbackUrl: "/" });
  }, []);

  const updateProfile = useCallback(
    async (input: { display_name: string }): Promise<AuthResult> => {
      const res = await fetch("/api/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: input.display_name }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        return { error: payload.error || "Unable to update profile." };
      }
      setProfile((current) =>
        current
          ? { ...current, display_name: payload.user?.name || input.display_name }
          : current
      );
      return { error: null };
    },
    []
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: data?.user?.id ? { id: data.user.id } : null,
      profile,
      loading: status === "loading",
      isConfigured: googleConfigured,
      signInWithGoogle,
      signOut: handleSignOut,
      updateProfile,
    }),
    [
      data?.user?.id,
      profile,
      status,
      googleConfigured,
      signInWithGoogle,
      handleSignOut,
      updateProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
