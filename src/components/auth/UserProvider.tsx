"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react"
import {
  UserProfile,
  CreateLocalUserInput,
  getStoredUser,
  saveStoredUser,
  clearStoredUser,
  createLocalUser,
} from "@/lib/user"

interface UserContextValue {
  user: UserProfile | null
  /** Whether the stored user has been read from localStorage yet. */
  ready: boolean
  /** Create a new local account. Returns an error string on validation failure. */
  createUser: (input: CreateLocalUserInput) => { error: string } | null
  /** Update the current profile. Returns an error string on validation failure. */
  updateUser: (input: CreateLocalUserInput) => { error: string } | null
  logout: () => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  ready: false,
  createUser: () => null,
  updateUser: () => null,
  logout: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setUser(getStoredUser())
    setReady(true)
  }, [])

  function createUser(input: CreateLocalUserInput): { error: string } | null {
    const result = createLocalUser(input)
    if ("error" in result) return result
    saveStoredUser(result)
    setUser(result)
    return null
  }

  function updateUser(input: CreateLocalUserInput): { error: string } | null {
    if (!user) return { error: "No profile to update." }
    const result = createLocalUser(input)
    if ("error" in result) return result
    // Keep the original id + createdAt when editing.
    const updated: UserProfile = {
      ...result,
      id: user.id,
      createdAt: user.createdAt,
    }
    saveStoredUser(updated)
    setUser(updated)
    return null
  }

  function logout() {
    clearStoredUser()
    setUser(null)
  }

  return (
    <UserContext.Provider
      value={{ user, ready, createUser, updateUser, logout }}
    >
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  return useContext(UserContext)
}
