"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import { UserProfile, getStoredUser, saveUser, clearUser } from "@/lib/user"

interface UserContextValue {
  user: UserProfile | null
  login: (profile: UserProfile) => void
  logout: () => void
  updateUser: (updates: Partial<UserProfile>) => void
}

const UserContext = createContext<UserContextValue>({
  user: null,
  login: () => {},
  logout: () => {},
  updateUser: () => {},
})

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)

  useEffect(() => {
    setUser(getStoredUser())
  }, [])

  function login(profile: UserProfile) {
    saveUser(profile)
    setUser(profile)
  }

  function logout() {
    clearUser()
    setUser(null)
  }

  function updateUser(updates: Partial<UserProfile>) {
    if (!user) return
    const updated = { ...user, ...updates }
    saveUser(updated)
    setUser(updated)
  }

  return (
    <UserContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser(): UserContextValue {
  return useContext(UserContext)
}
