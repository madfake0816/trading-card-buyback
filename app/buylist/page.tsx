'use client'

import { useState, useEffect } from 'react'
import { searchMTGCards, getCardImageUrl } from '@/lib/api/scryfall'
import { calculateBuyPrice } from '@/lib/pricing'
import SafeImage from '@/components/SafeImage'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'

interface BuylistCard {
  name: string
  set_name: string
  set_code: string
  image_url: string
  market_price: number
  buy_price: number
  rarity: string
}

export default function PublicBuylistPage() {
  const { language } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [cards, setCards] = useState<BuylistCard[]>([])
  const [loading, setLoading] = useState(false)
  const [featuredCards, setFeaturedCards] = useState<BuylistCard[]>([])

  useEffect(() => {
    loadFeaturedCards()
  }, [])

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        handleSearch(searchQuery)
      } else if (searchQuery.length < 2) {
        setCards([])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const loadFeaturedCards = async () => {
    // Load some popular/high-value cards as featured
    const featuredCardNames = [
      'Black Lotus',
      'Mox Ruby',
      'Time Walk',
      'Ancestral Recall',
      'Tropical Island',
      'Tundra',
      'Underground Sea',
      'Volcanic Island'
    ]

    const featured: BuylistCard[] = []

    for (const cardName of featuredCardNames.slice(0, 4)) {
      try {
        const results = await searchMTGCards(cardName, 'en')
        if (results.length > 0) {
          const card = results[0]
          const marketPrice = parseFloat(card.prices?.eur || card.prices?.usd || '0')
          
          if (marketPrice > 0) {
            featured.push({
              name: card.name,
              set_name: card.set_name,
              set_code: card.set.toUpperCase(),
              image_url: getCardImageUrl(card),
              market_price: marketPrice,
              buy_price: calculateBuyPrice(marketPrice),
              rarity: card.rarity
            })
          }
        }
      } catch (error) {
        console.error('Error loading featured card:', cardName, error)
      }
    }

    setFeaturedCards(featured)
  }

  const handleSearch = async (query: string) => {
    setLoading(true)
    try {
      const results = await searchMTGCards(query, 'en')
      
      const buylistCards = results
        .filter(card => {
          const price = parseFloat(card.prices?.eur || card.prices?.usd || '0')
          return price > 0
        })
        .slice(0, 20) // Limit to 20 results
        .map(card => {
          const marketPrice = parseFloat(card.prices?.eur || card.prices?.usd || '0')
          return {
            name: card.name,
            set_name: card.set_name,
            set_code: card.set.toUpperCase(),
            image_url: getCardImageUrl(card),
            market_price: marketPrice,
            buy_price: calculateBuyPrice(marketPrice),
            rarity: card.rarity
          }
        })

      setCards(buylistCards)
    } catch (error) {
      console.error('Search error:', error)
      setCards([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-800 to-slate-900 border-b border-slate-700">
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-5xl font-bold text-cyan-500 mb-4">
            {language === 'de' ? 'MTG Ankaufsliste' : 'MTG Buylist'}
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {language === 'de' 
              ? 'Suchen Sie nach Karten und sehen Sie sofort unsere Ankaufspreise. Faire Preise, schnelle Bezahlung.'
              : 'Search for cards and see our instant buylist prices. Fair prices, fast payment.'
            }
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'de' ? 'Kartenname eingeben...' : 'Enter card name...'}
              className="input-field w-full text-lg py-4"
            />
            <p className="text-sm text-gray-400 mt-3">
              {language === 'de' 
                ? '💡 Tipp: Suchen Sie auf Englisch oder Deutsch'
                : '💡 Tip: Search in English or German'
              }
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* How It Works */}
        <div className="card p-8 mb-12">
          <h2 className="text-3xl font-bold text-cyan-500 mb-6 text-center">
            {language === 'de' ? 'So funktioniert es' : 'How It Works'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'de' ? '1. Suchen' : '1. Search'}
              </h3>
              <p className="text-gray-400">
                {language === 'de' 
                  ? 'Suchen Sie nach Ihren Karten und sehen Sie unsere Preise'
                  : 'Search for your cards and see our prices'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'de' ? '2. Liste erstellen' : '2. Create List'}
              </h3>
              <p className="text-gray-400">
                {language === 'de' 
                  ? 'Erstellen Sie Ihre Verkaufsliste mit allen Details'
                  : 'Build your sell list with all details'
                }
              </p>
            </div>
            <div className="text-center">
              <div className="text-5xl mb-4">💰</div>
              <h3 className="text-xl font-bold mb-2">
                {language === 'de' ? '3. Bezahlung' : '3. Get Paid'}
              </h3>
              <p className="text-gray-400">
                {language === 'de' 
                  ? 'Schnelle Zahlung per Überweisung oder Store Credit'
                  : 'Fast payment via bank transfer or store credit'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Featured Cards */}
        {!searchQuery && featuredCards.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-cyan-500 mb-6">
              {language === 'de' ? 'Gefragte Karten' : 'Featured Cards'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {featuredCards.map((card, index) => (
                <div key={index} className="card p-4 hover:border-cyan-500 transition-all">
                  <SafeImage
                    src={card.image_url}
                    alt={card.name}
                    className="w-full rounded mb-3"
                    unoptimized
                  />
                  <h3 className="font-bold text-lg mb-1 truncate">{card.name}</h3>
                  <p className="text-sm text-gray-400 mb-3 truncate">
                    {card.set_name} ({card.set_code})
                  </p>
                  <div className="bg-emerald-900 bg-opacity-30 border border-emerald-600 p-3 rounded">
                    <div className="text-xs text-gray-400">We buy for:</div>
                    <div className="text-2xl font-bold text-emerald-500">
                      €{card.buy_price.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {loading && (
          <div className="text-center py-12">
            <div className="text-2xl text-cyan-500">
              {language === 'de' ? 'Suche läuft...' : 'Searching...'}
            </div>
          </div>
        )}

        {!loading && searchQuery && cards.length === 0 && (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-2xl font-bold mb-2">
              {language === 'de' ? 'Keine Karten gefunden' : 'No Cards Found'}
            </h2>
            <p className="text-gray-400">
              {language === 'de' 
                ? 'Versuchen Sie einen anderen Suchbegriff'
                : 'Try a different search term'
              }
            </p>
          </div>
        )}

        {!loading && cards.length > 0 && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-bold text-cyan-500">
                {language === 'de' ? 'Suchergebnisse' : 'Search Results'} ({cards.length})
              </h2>
              <Link href="/mtg" className="btn-primary">
                {language === 'de' ? 'Liste erstellen →' : 'Build List →'}
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map((card, index) => (
                <div key={index} className="card p-4 hover:border-cyan-500 transition-all">
                  <SafeImage
                    src={card.image_url}
                    alt={card.name}
                    className="w-full rounded mb-3"
                    unoptimized
                  />
                  <h3 className="font-bold text-lg mb-1 truncate" title={card.name}>
                    {card.name}
                  </h3>
                  <p className="text-sm text-gray-400 mb-1 truncate">
                    {card.set_name}
                  </p>
                  <p className="text-xs text-gray-500 mb-3">
                    {card.set_code} • {card.rarity}
                  </p>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Market Price:</span>
                      <span className="font-semibold">€{card.market_price.toFixed(2)}</span>
                    </div>
                    <div className="bg-emerald-900 bg-opacity-30 border border-emerald-600 p-3 rounded">
                      <div className="text-xs text-gray-400">We buy for:</div>
                      <div className="text-2xl font-bold text-emerald-500">
                        €{card.buy_price.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Call to Action */}
        {!searchQuery && (
          <div className="card p-12 text-center mt-12 bg-gradient-to-br from-slate-800 to-slate-900">
            <h2 className="text-3xl font-bold text-cyan-500 mb-4">
              {language === 'de' ? 'Bereit zu verkaufen?' : 'Ready to Sell?'}
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              {language === 'de' 
                ? 'Erstellen Sie Ihre Verkaufsliste und erhalten Sie sofort ein Angebot'
                : 'Create your sell list and get an instant offer'
              }
            </p>
            <Link href="/mtg" className="btn-primary text-lg px-8 py-4 inline-block">
              {language === 'de' ? '🚀 Jetzt starten' : '🚀 Start Now'}
            </Link>
          </div>
        )}

        {/* Why Sell to Us */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">⚡</div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'de' ? 'Schnelle Zahlung' : 'Fast Payment'}
            </h3>
            <p className="text-gray-400 text-sm">
              {language === 'de' 
                ? 'Zahlung innerhalb von 24 Stunden nach Prüfung'
                : 'Payment within 24 hours after inspection'
              }
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">💎</div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'de' ? 'Faire Preise' : 'Fair Prices'}
            </h3>
            <p className="text-gray-400 text-sm">
              {language === 'de' 
                ? 'Transparente Preise basierend auf Marktwerten'
                : 'Transparent prices based on market values'
              }
            </p>
          </div>

          <div className="card p-6 text-center">
            <div className="text-4xl mb-3">🛡️</div>
            <h3 className="text-xl font-bold mb-2">
              {language === 'de' ? 'Sicher' : 'Secure'}
            </h3>
            <p className="text-gray-400 text-sm">
              {language === 'de' 
                ? 'Sichere Abwicklung und professionelle Prüfung'
                : 'Secure processing and professional inspection'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
