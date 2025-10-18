'use client'

import { useLanguage } from '@/context/LanguageContext'

interface TranslatedTextProps {
  en: string
  de: string
  className?: string
}

export default function TranslatedText({ en, de, className }: TranslatedTextProps) {
  const { language } = useLanguage()
  
  return (
    <span className={className}>
      {language === 'de' ? de : en}
    </span>
  )
}