"use client"

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import type { Session, User } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/client"
import type { AuthUserProfileInput, Profile } from "@/types/supabase"

interface AuthResult {
  error: string | null
}

interface AuthContextValue {
  user: User | null
  profile: Profile | null
  loading: boolean
  isConfigured: boolean
  signUp: (
    email: string,
    password: string,
    profileData: AuthUserProfileInput
  ) => Promise<AuthResult>
  signIn: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<void>
  updateProfile: (input: AuthUserProfileInput) => Promise<AuthResult>
  refreshProfile: () => Promise<void>
}

const noop = async (): Promise<AuthResult> => ({
  error: "Cloud accounts are not configured.",
})

const AuthContext = createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: false,
  isConfigured: false,
  signUp: noop,
  signIn: noop,
  signOut: async () => {},
  updateProfile: noop,
  refreshProfile: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Created once; null when Supabase env vars are missing.
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const isConfigured = supabase !== null

  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState<boolean>(isConfigured)

  const fetchProfile = useCallback(
    async (userId: string): Promise<Profile | null> => {
      if (!supabase) return null
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle()
      if (error) return null
      return (data as Profile) ?? null
    },
    [supabase]
  )

  // Initial session load + auth state subscription.
  useEffect(() => {
    if (!supabase) return

    let active = true

    const init = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!active) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        setProfile(await fetchProfile(sessionUser.id))
      }
      setLoading(false)
    }

    init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session: Session | null) => {
      if (!active) return
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (sessionUser) {
        setProfile(await fetchProfile(sessionUser.id))
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  const refreshProfile = useCallback(async () => {
    if (!supabase || !user) return
    setProfile(await fetchProfile(user.id))
  }, [supabase, user, fetchProfile])

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      profileData: AuthUserProfileInput
    ): Promise<AuthResult> => {
      if (!supabase) return { error: "Cloud accounts are not configured." }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: profileData.display_name,
            username: profileData.username,
          },
        },
      })
      if (error) return { error: error.message }

      // The database trigger creates the profile row from the metadata above.
      // If the user has an active session immediately (email confirmation off),
      // ensure the profile reflects exactly what they entered.
      if (data.user && data.session) {
        await supabase
          .from("profiles")
          .upsert({
            id: data.user.id,
            display_name: profileData.display_name,
            username: profileData.username,
            avatar_url: profileData.avatar_url ?? null,
          })
        setProfile(await fetchProfile(data.user.id))
      }
      return { error: null }
    },
    [supabase, fetchProfile]
  )

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      if (!supabase) return { error: "Cloud accounts are not configured." }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) return { error: error.message }
      return { error: null }
    },
    [supabase]
  )

  const signOut = useCallback(async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
  }, [supabase])

  const updateProfile = useCallback(
    async (input: AuthUserProfileInput): Promise<AuthResult> => {
      if (!supabase) return { error: "Cloud accounts are not configured." }
      if (!user) return { error: "You must be logged in to edit your profile." }

      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: input.display_name,
          username: input.username,
          avatar_url: input.avatar_url ?? null,
        })
        .eq("id", user.id)

      if (error) {
        // Unique violation on username.
        if (error.code === "23505") {
          return { error: "That username is already taken." }
        }
        return { error: error.message }
      }
      setProfile(await fetchProfile(user.id))
      return { error: null }
    },
    [supabase, user, fetchProfile]
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      loading,
      isConfigured,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    }),
    [
      user,
      profile,
      loading,
      isConfigured,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext)
}
