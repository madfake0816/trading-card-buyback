'use client'

import { useState, useEffect, useRef } from 'react'
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
  const [isHovering, setIsHovering] = useState(false)
  const [touchStart, setTouchStart] = useState(0)
  const [touchEnd, setTouchEnd] = useState(0)
  const autoRotateRef = useRef<NodeJS.Timeout | null>(null)
  const supabase = createClient()

  // Responsive card count
  const [cardsPerView, setCardsPerView] = useState(3)

  useEffect(() => {
    loadFeaturedCards()
    updateCardsPerView()

    // Handle window resize
    const handleResize = () => updateCardsPerView()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotate effect
  useEffect(() => {
    if (cards.length <= cardsPerView || isHovering) {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
      return
    }

    autoRotateRef.current = setInterval(() => {
      handleNext()
    }, 5000) // Auto-rotate every 5 seconds

    return () => {
      if (autoRotateRef.current) {
        clearInterval(autoRotateRef.current)
      }
    }
  }, [cards.length, cardsPerView, isHovering, currentIndex])

  const updateCardsPerView = () => {
    if (window.innerWidth >= 1536) { // 2xl
      setCardsPerView(5)
    } else if (window.innerWidth >= 1280) { // xl
      setCardsPerView(4)
    } else if (window.innerWidth >= 768) { // md
      setCardsPerView(3)
    } else {
      setCardsPerView(1)
    }
  }

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
    setCurrentIndex((prev) => {
      // Infinite loop - go to end if at start
      if (prev === 0) {
        return Math.max(0, cards.length - cardsPerView)
      }
      return Math.max(0, prev - cardsPerView)
    })
  }

  const handleNext = () => {
    setCurrentIndex((prev) => {
      // Infinite loop - go to start if at end
      if (prev >= cards.length - cardsPerView) {
        return 0
      }
      return Math.min(cards.length - cardsPerView, prev + cardsPerView)
    })
  }

  // Touch handlers for swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe) {
      handleNext()
    }
    if (isRightSwipe) {
      handlePrevious()
    }

    // Reset
    setTouchStart(0)
    setTouchEnd(0)
  }

  const canGoPrevious = cards.length > cardsPerView
  const canGoNext = cards.length > cardsPerView

  if (loading) {
    return null
  }

  if (cards.length === 0) {
    return null
  }

  // Get visible cards with wrapping
const getVisibleCards = (): FeaturedCard[] => {
  if (cards.length <= cardsPerView) {
    return cards
  }

  const visible: FeaturedCard[] = []  // Add explicit type here
  for (let i = 0; i < cardsPerView; i++) {
    const index = (currentIndex + i) % cards.length
    visible.push(cards[index])
  }
  return visible
}

  const visibleCards = getVisibleCards()

  return (
    <div className="max-w-7xl mx-auto mt-12 mb-8 px-4">
      <div 
        className="card p-6 sm:p-8 bg-gradient-to-br from-emerald-900 to-slate-800 border-2 border-emerald-600"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
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
        <div 
          className="relative"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Left Arrow */}
          {canGoPrevious && (
            <button
              onClick={handlePrevious}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg transition-all border-2 border-emerald-500 hover:border-emerald-400 hover:scale-110"
              aria-label="Previous cards"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-6 transition-all duration-300">
            {visibleCards.map((card) => (
              <div
                key={`${card.id}-${currentIndex}`}
                className="bg-slate-900 rounded-lg p-3 sm:p-4 hover:bg-slate-800 transition-all transform hover:scale-105 border border-slate-700 hover:border-emerald-500 animate-fadeIn"
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
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-full shadow-lg transition-all border-2 border-emerald-500 hover:border-emerald-400 hover:scale-110"
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
            {Array.from({ length: Math.ceil(cards.length / cardsPerView) }).map((_, index) => {
              const pageIndex = Math.floor(currentIndex / cardsPerView)
              return (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index * cardsPerView)}
                  className={`h-2 rounded-full transition-all ${
                    pageIndex === index
                      ? 'w-8 bg-emerald-500'
                      : 'w-2 bg-slate-600 hover:bg-slate-500'
                  }`}
                  aria-label={`Go to page ${index + 1}`}
                />
              )
            })}
          </div>
        )}

        {/* Bottom Info */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-300">
            <TranslatedText
              en="💡 Have these cards? Add them to your sell list and get instant payment!"
              de="💡 Haben Sie diese Karten? Fügen Sie sie Ihrer Verkaufsliste hinzu und erhalten Sie sofort Zahlung!"
            />
          </p>
          {cards.length > cardsPerView && (
            <p className="text-xs text-gray-400 mt-2">
              {isHovering ? (
                <TranslatedText
                  en="👆 Paused - Move mouse away to resume auto-rotation"
                  de="👆 Pausiert - Bewegen Sie die Maus weg, um die automatische Rotation fortzusetzen"
                />
              ) : (
                <TranslatedText
                  en={`Showing ${cards.length} featured cards • Auto-rotating every 5 seconds`}
                  de={`Zeige ${cards.length} gefragte Karten • Automatische Rotation alle 5 Sekunden`}
                />
              )}
            </p>
          )}
        </div>
      </div>

      {/* Add CSS animation */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}