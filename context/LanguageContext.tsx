'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

type Language = 'en' | 'de'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en')
  const [isClient, setIsClient] = useState(false)

  // Only run on client side
  useEffect(() => {
    setIsClient(true)
    const saved = localStorage.getItem('language') as Language
    if (saved === 'en' || saved === 'de') {
      setLanguage(saved)
    }
  }, [])

  const updateLanguage = (lang: Language) => {
    console.log('💾 Updating language to:', lang)
    setLanguage(lang)
    if (isClient) {
      localStorage.setItem('language', lang)
    }
    
    // Force update by dispatching a custom event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('languageChange', { detail: lang }))
    }
  }

  // Don't render children until client-side hydration is complete
  if (!isClient) {
    return null
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage: updateLanguage }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}