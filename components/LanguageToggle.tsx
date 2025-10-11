'use client'

import { useLanguage } from '@/context/LanguageContext'
import { useState, useEffect } from 'react'

export default function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="flex gap-1 sm:gap-2 bg-dark-blue-light rounded-lg p-1">
        <button className="px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-semibold bg-yellow-accent text-black">
          DE
        </button>
        <button className="px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-semibold text-gray-400 hover:text-white">
          EN
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-1 sm:gap-2 bg-dark-blue-light rounded-lg p-1">
      <button
        onClick={() => setLanguage('de')}
        className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-colors ${
          language === 'de'
            ? 'bg-yellow-accent text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        DE
      </button>
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm font-semibold transition-colors ${
          language === 'en'
            ? 'bg-yellow-accent text-black'
            : 'text-gray-400 hover:text-white'
        }`}
      >
        EN
      </button>
    </div>
  )
}