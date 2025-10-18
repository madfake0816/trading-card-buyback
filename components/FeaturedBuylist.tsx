'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import SafeImage from '@/components/SafeImage'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import TranslatedText from '@/components/TranslatedText'

interface FeaturedCard {
  id: string
  card_name: string
  set_code: string
  set_name: string
  image_url: string
  market_price: number
  buy_price: number
  display_order: number
}

export default function FeaturedBuylist() {
  const { language } = useLanguage()
  const [cards, setCards] = useState<FeaturedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [currentIndex, setCurrentIndex] = useState(0)
  const supabase = createClient()

  const cardsPerView = 3 // Show 3 cards at a time

  useEffect(() => {
    loadFeaturedCards()
  }, [])

  const loadFeaturedCards = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_buylist')
        .select('*')
        .eq('active', true)
        .order('display_order', { ascending: true })

      if (error) throw error

      setCards(data || [])
    } catch (error) {
      console.error('Error loading featured cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - cardsPerView))
  }

  const handleNext = () => {
    setCurrentIndex((prev) => 
      Math.min(cards.length - cardsPerView, prev + cardsPerView)
    )
  }

  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < cards.length - cardsPerView

  if (loading) {
    return null
  }

  if (cards.length === 0) {
    return null
  }

  // Get visible cards
  const visibleCards = cards.slice(currentIndex, currentIndex + cardsPerView)

  return (
    <div className="max-w-6xl mx-auto mt-12 mb-8">
      <div className="card p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-slate-800 border-2 border-emerald-600">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              <TranslatedText
                en="🔥 Hot Buylist - We're Buying!"
                de="🔥 Gesuchte Karten - Wir kaufen!"
              />
            </h3>
            <p className="text-gray-300 text-sm sm:text-base">
              <TranslatedText
                en="These cards are in high demand. Get the best prices now!"
                de="Diese Karten sind sehr gefragt. Erhalten Sie jetzt die besten Preise!"
              />
            </p>
          </div>
          <Link
            href="/mtg"
            className="btn-primary whitespace-nowrap"
          >
            <TranslatedText
              en="Sell Now →"
              de="Jetzt verkaufen →"
            />
          </Link>
        </div>

        {/* Carousel */}
        <div className="relative">
          {/* Left Arrow */}
          {canGoPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg transition-all border-2 border-emerald-500 hover:border-emerald-400"
              aria-label="Previous cards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
            {visibleCards.map((card) => (
              <div
                key={card.id}
                className="bg-slate-900 rounded-lg p-3 sm:p-4 hover:bg-slate-800 transition-all transform hover:scale-105 border border-slate-700 hover:border-emerald-500"
              >
                {card.image_url && (
                  <SafeImage
                    src={card.image_url}
                    alt={card.card_name}
                    className="w-full rounded mb-3"
                    unoptimized
                  />
                )}
                <h4 className="font-bold text-white text-sm sm:text-base mb-1 truncate" title={card.card_name}>
                  {card.card_name}
                </h4>
                <p className="text-xs text-gray-400 mb-3 truncate">
                  {card.set_name} ({card.set_code})
                </p>
                
                <div className="bg-emerald-900 bg-opacity-50 border border-emerald-500 p-2 sm:p-3 rounded">
                  <div className="text-xs text-gray-300">
                    <TranslatedText en="We pay:" de="Wir zahlen:" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold text-emerald-400">
                    €{card.buy_price.toFixed(2)}
                  </div>
                  {card.market_price > 0 && (
                    <div className="text-xs text-gray-400 mt-1">
                      <TranslatedText en="Market:" de="Markt:" /> €{card.market_price.toFixed(2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {canGoNext && (
            <button
              onClick={handleNext}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg transition-all border-2 border-emerald-500 hover:border-emerald-400"
              aria-label="Next cards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {cards.length > cardsPerView && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: Math.ceil(cards.length / cardsPerView) }).map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index * cardsPerView)}
                className={`h-2 rounded-full transition-all ${
                  Math.floor(currentIndex / cardsPerView) === index
                    ? 'w-8 bg-emerald-500'
                    : 'w-2 bg-slate-600 hover:bg-slate-500'
                }`}
                aria-label={`Go to page ${index + 1}`}
              />
            ))}
          </div>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            <TranslatedText
              en="💡 Have these cards? Add them to your sell list and get instant payment!"
              de="💡 Haben Sie diese Karten? Fügen Sie sie Ihrer Verkaufsliste hinzu und erhalten Sie sofort Zahlung!"
            />
          </p>
          {cards.length > cardsPerView && (
            <p className="text-xs text-gray-400 mt-2">
              <TranslatedText
                en={`Showing ${currentIndex + 1}-${Math.min(currentIndex + cardsPerView, cards.length)} of ${cards.length} cards`}
                de={`Zeige ${currentIndex + 1}-${Math.min(currentIndex + cardsPerView, cards.length)} von ${cards.length} Karten`}
              />
            </p>
          )}
        </div>
      </div>
    </div>
  )
}