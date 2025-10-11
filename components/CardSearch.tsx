'use client'

import { useState, useEffect, useMemo } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslations } from '@/lib/i18n'
import Fuse from 'fuse.js'

interface CardSearchProps {
  cards: any[]
  onSelectCard: (card: any) => void
  tcgName: string
}

interface GroupedCard {
  name: string
  nameDE: string
  sets: any[]
  imageUrl: string
  id: string
}

export default function CardSearch({ cards, onSelectCard, tcgName }: CardSearchProps) {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const [searchQuery, setSearchQuery] = useState('')
  const [results, setResults] = useState<GroupedCard[]>([])
  const [showResults, setShowResults] = useState(false)

  // Group cards by name (for mock data that might have duplicates)
  const groupedCards = useMemo(() => {
    const grouped: { [key: string]: GroupedCard } = {}
    
    cards.forEach(card => {
      const key = card.name.toLowerCase()
      if (!grouped[key]) {
        grouped[key] = {
          name: card.name,
          nameDE: card.nameDE,
          sets: card.sets || [],
          imageUrl: card.imageUrl,
          id: card.id,
        }
      } else {
        // Merge sets if card appears multiple times
        grouped[key].sets = [...grouped[key].sets, ...(card.sets || [])]
      }
    })
    
    return Object.values(grouped)
  }, [cards])

  useEffect(() => {
    if (searchQuery.length < 2) {
      setResults([])
      setShowResults(false)
      return
    }

    const fuse = new Fuse(groupedCards, {
      keys: language === 'de' ? ['nameDE', 'name'] : ['name', 'nameDE'],
      threshold: 0.3,
      includeScore: true,
    })

    const searchResults = fuse.search(searchQuery)
    setResults(searchResults.map(result => result.item).slice(0, 10))
    setShowResults(true)
  }, [searchQuery, groupedCards, language])

  const handleSelectCard = (card: GroupedCard) => {
    onSelectCard(card)
    setSearchQuery('')
    setShowResults(false)
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="input-field w-full"
        onFocus={() => searchQuery.length >= 2 && setShowResults(true)}
      />
      
      {showResults && results.length > 0 && (
        <div className="absolute z-10 w-full mt-2 bg-dark-blue-light border border-yellow-accent rounded-lg shadow-xl max-h-96 overflow-y-auto">
          {results.map((card, index) => (
            <button
              key={`${card.id}-${index}`}
              onClick={() => handleSelectCard(card)}
              className="w-full text-left px-4 py-3 hover:bg-yellow-accent hover:text-black transition-colors border-b border-gray-700 last:border-b-0"
            >
              <div className="font-semibold">
                {language === 'de' ? card.nameDE : card.name}
              </div>
              <div className="text-sm text-gray-400">
                {card.sets?.length || 0} {card.sets?.length === 1 ? 'set' : 'sets'} available
              </div>
            </button>
          ))}
        </div>
      )}
      
      {showResults && results.length === 0 && searchQuery.length >= 2 && (
        <div className="absolute z-10 w-full mt-2 bg-dark-blue-light border border-gray-600 rounded-lg p-4 text-center text-gray-400">
          {t('noResults')}
        </div>
      )}
    </div>
  )
}