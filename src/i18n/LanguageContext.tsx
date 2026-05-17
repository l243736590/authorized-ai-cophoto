/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Language = 'zh' | 'ko'
export type ThemeMode = 'day' | 'night'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  isKo: boolean
  theme: ThemeMode
  setTheme: (theme: ThemeMode) => void
  isDay: boolean
}

const LanguageContext = createContext<LanguageContextValue | null>(null)
const languageStorageKey = 'authorized-ai-cophoto-language'
const themeStorageKey = 'authorized-ai-cophoto-theme'

function getOrCreateFaviconLink() {
  const existingLink = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (existingLink) {
    existingLink.type = 'image/png'
    return existingLink
  }

  const link = document.createElement('link')
  link.rel = 'icon'
  link.type = 'image/png'
  document.head.appendChild(link)
  return link
}

function updateFavicon(language: Language, theme: ThemeMode) {
  const preferredTone = theme === 'day' ? 'dark' : 'light'
  const fallbackTone = theme === 'day' ? 'light' : 'dark'
  const preferredPath = `/brand/${language}-mark-${preferredTone}.png`
  const fallbackPath = `/brand/${language}-mark-${fallbackTone}.png`
  const link = getOrCreateFaviconLink()
  const probe = new Image()

  probe.onload = () => {
    link.href = preferredPath
  }
  probe.onerror = () => {
    link.href = fallbackPath
  }
  probe.src = preferredPath
}

function getInitialLanguage(): Language {
  return window.localStorage.getItem(languageStorageKey) === 'ko' ? 'ko' : 'zh'
}

function getInitialTheme(): ThemeMode {
  return window.localStorage.getItem(themeStorageKey) === 'day' ? 'day' : 'night'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => getInitialLanguage())
  const [theme, setThemeState] = useState<ThemeMode>(() => getInitialTheme())

  useEffect(() => {
    document.documentElement.lang = language === 'ko' ? 'ko' : 'zh-CN'
    document.documentElement.dataset.theme = theme
    document.title = language === 'ko' ? '공식투샷 | Licensed Frame' : '授权同框 | Licensed Frame'
    updateFavicon(language, theme)
  }, [language, theme])

  const value = useMemo<LanguageContextValue>(() => {
    function setLanguage(nextLanguage: Language) {
      window.localStorage.setItem(languageStorageKey, nextLanguage)
      setLanguageState(nextLanguage)
    }

    function setTheme(nextTheme: ThemeMode) {
      window.localStorage.setItem(themeStorageKey, nextTheme)
      setThemeState(nextTheme)
    }

    return {
      language,
      setLanguage,
      isKo: language === 'ko',
      theme,
      setTheme,
      isDay: theme === 'day',
    }
  }, [language, theme])

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used inside LanguageProvider')
  }
  return context
}
