"use client"

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react"
import {
  DEFAULT_LANGUAGE,
  translations,
  type LanguageCode,
  type TranslationKey,
} from "@/lib/i18n"

type I18nContextValue = {
  language: LanguageCode
  setLanguage: (language: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

const STORAGE_KEY = "poltracker-language"

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(DEFAULT_LANGUAGE)

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY) as LanguageCode | null
    if (saved && translations[saved]) {
      setLanguageState(saved)
    }
  }, [])

  const setLanguage = (nextLanguage: LanguageCode) => {
    if (!translations[nextLanguage]) return
    setLanguageState(nextLanguage)
    window.localStorage.setItem(STORAGE_KEY, nextLanguage)
  }

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key: TranslationKey) =>
        translations[language]?.[key] ?? translations[DEFAULT_LANGUAGE][key] ?? key,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useTranslation(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useTranslation must be used inside I18nProvider")
  }
  return context
}
