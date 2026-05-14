"use client"

import React, { createContext, useContext, useEffect, useState } from "react"
import {
  LanguageCode,
  TranslationKey,
  getStoredLanguage,
  setStoredLanguage,
  translate,
} from "@/lib/i18n"

interface I18nContextValue {
  language: LanguageCode
  setLanguage: (code: LanguageCode) => void
  t: (key: TranslationKey) => string
}

const I18nContext = createContext<I18nContextValue>({
  language: "en",
  setLanguage: () => {},
  t: (key) => key,
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>("en")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setLanguageState(getStoredLanguage())
    setMounted(true)
  }, [])

  function setLanguage(code: LanguageCode) {
    setLanguageState(code)
    setStoredLanguage(code)
  }

  function t(key: TranslationKey): string {
    return translate(key, language)
  }

  if (!mounted) {
    return <>{children}</>
  }

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslation(): I18nContextValue {
  return useContext(I18nContext)
}
