"use client"

import { useLanguage } from '@/lib/languageContext'
import { Button } from '@/components/ui/button'

export function LanguageToggle({ variant = 'default' }: { variant?: 'default' | 'landing' | 'dashboard' }) {
  const { language, setLanguage } = useLanguage()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en')
  }

  if (variant === 'landing') {
    return (
      <button
        onClick={toggleLanguage}
        className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 rounded-full text-white font-semibold transition-all"
      >
        <span className="text-xl">{language === 'en' ? '🇮🇳' : '🇬🇧'}</span>
        <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
      </button>
    )
  }

  if (variant === 'dashboard') {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-2 px-3 py-1.5 bg-green-50 hover:bg-green-100 border border-green-200 rounded-lg text-green-700 font-medium text-sm transition-all"
      >
        <span>{language === 'en' ? '🇮🇳' : '🇬🇧'}</span>
        <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
      </button>
    )
  }

  return (
    <Button
      onClick={toggleLanguage}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      <span>{language === 'en' ? '🇮🇳' : '🇬🇧'}</span>
      <span>{language === 'en' ? 'हिंदी' : 'English'}</span>
    </Button>
  )
}
