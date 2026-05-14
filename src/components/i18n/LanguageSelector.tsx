"use client"

import { useState, useRef, useEffect } from "react"
import { SUPPORTED_LANGUAGES } from "@/lib/i18n"
import { useTranslation } from "./I18nProvider"

export function LanguageSelector() {
  const { language, setLanguage } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = SUPPORTED_LANGUAGES.find((l) => l.code === language)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-muted"
        title="Select language"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
          />
        </svg>
        <span>{current?.nativeName ?? "EN"}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 rounded-xl border border-border bg-card shadow-lg py-1">
          <p className="px-3 pt-2 pb-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
            Language
          </p>
          <p className="px-3 pb-2 text-[10px] text-muted-foreground">
            Article content stays in its original language.
          </p>
          {SUPPORTED_LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code)
                setOpen(false)
              }}
              className={`w-full text-left px-3 py-2 text-sm transition-colors hover:bg-muted flex items-center justify-between ${
                language === lang.code
                  ? "text-primary font-medium"
                  : "text-foreground"
              }`}
            >
              <span>{lang.nativeName}</span>
              {language === lang.code && (
                <svg
                  className="w-3.5 h-3.5 text-primary"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
