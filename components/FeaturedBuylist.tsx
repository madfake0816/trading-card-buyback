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
  tcg: string
}

interface TCGSection {
  name: string
  path: string
  cards: FeaturedCard[]
  gradient: string
  icon: string
}

export default function FeaturedBuylist() {
  const { language } = useLanguage()
  const [tcgSections, setTcgSections] = useState<TCGSection[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

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

      // Group cards by TCG
      const grouped = groupByTCG(data || [])
      setTcgSections(grouped)
    } catch (error) {
      console.error('Error loading featured cards:', error)
    } finally {
      setLoading(false)
    }
  }

  const groupByTCG = (cards: FeaturedCard[]): TCGSection[] => {
    const tcgMap = new Map<string, FeaturedCard[]>()

    cards.forEach(card => {
      const tcg = card.tcg || 'Magic: The Gathering'
      if (!tcgMap.has(tcg)) {
        tcgMap.set(tcg, [])
      }
      tcgMap.get(tcg)!.push(card)
    })

    const sections: TCGSection[] = []

    // MTG Section
    if (tcgMap.has('Magic: The Gathering')) {
      sections.push({
        name: 'Magic: The Gathering',
        path: '/mtg',
        cards: tcgMap.get('Magic: The Gathering')!.slice(0, 4),
        gradient: 'from-orange-500 to-red-500',
        icon: '🔮'
      })
    }

    // Pokémon Section
    if (tcgMap.has('Pokémon')) {
      sections.push({
        name: 'Pokémon',
        path: '/pokemon',
        cards: tcgMap.get('Pokémon')!.slice(0, 4),
        gradient: 'from-yellow-500 to-red-500',
        icon: '⚡'
      })
    }

    // Yu-Gi-Oh Section
    if (tcgMap.has('Yu-Gi-Oh!')) {
      sections.push({
        name: 'Yu-Gi-Oh!',
        path: '/yugioh',
        cards: tcgMap.get('Yu-Gi-Oh!')!.slice(0, 4),
        gradient: 'from-purple-500 to-pink-500',
        icon: '🎴'
      })
    }

    return sections
  }

  if (loading) {
    return null
  }

  if (tcgSections.length === 0) {
    return null
  }

  return (
    <div className="max-w-7xl mx-auto mt-16 mb-8">
      <div className="text-center mb-8">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
          <TranslatedText
            en="🔥 Hot Buylist"
            de="🔥 Gesuchte Karten"
          />
        </h2>
        <p className="text-gray-400">
          <TranslatedText
            en="High demand cards - Get the best prices now!"
            de="Sehr gefragte Karten - Erhalten Sie jetzt die besten Preise!"
          />
        </p>
      </div>

      <div className="space-y-6">
        {tcgSections.map((section) => (
          <div key={section.name} className="card p-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${section.gradient} rounded-lg flex items-center justify-center text-2xl`}>
                  {section.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{section.name}</h3>
                  <p className="text-sm text-gray-400">
                    <TranslatedText
                      en={`${section.cards.length} featured cards`}
                      de={`${section.cards.length} gefragte Karten`}
                    />
                  </p>
                </div>
              </div>
              <Link
                href={section.path}
                className="btn-primary text-sm"
              >
                <TranslatedText
                  en="View All →"
                  de="Alle anzeigen →"
                />
              </Link>
            </div>

            {/* Cards Grid - Compact */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {section.cards.map((card) => (
                <Link
                  key={card.id}
                  href={section.path}
                  className="bg-[#1a2029] rounded-lg p-3 hover:bg-[#1f2632] transition-all group"
                >
                  {card.image_url && (
                    <div className="relative overflow-hidden rounded mb-2">
                      <SafeImage
                        src={card.image_url}
                        alt={card.card_name}
                        className="w-full group-hover:scale-105 transition-transform"
                        unoptimized
                      />
                    </div>
                  )}
                  <h4 className="font-bold text-white text-xs mb-1 truncate" title={card.card_name}>
                    {card.card_name}
                  </h4>
                  <p className="text-[10px] text-gray-400 mb-2 truncate">
                    {card.set_name}
                  </p>
                  
                  <div className="bg-gradient-to-br from-emerald-900/50 to-emerald-800/50 border border-emerald-500/30 p-2 rounded">
                    <div className="text-[10px] text-gray-300">
                      <TranslatedText en="We pay:" de="Wir zahlen:" />
                    </div>
                    <div className="text-lg font-bold text-emerald-400">
                      €{card.buy_price.toFixed(2)}
                    </div>
                    {card.market_price > 0 && (
                      <div className="text-[10px] text-gray-400">
                        <TranslatedText en="Market:" de="Markt:" /> €{card.market_price.toFixed(2)}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom CTA */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          <TranslatedText
            en="💡 Have these cards? Click on any game to start selling!"
            de="💡 Haben Sie diese Karten? Klicken Sie auf ein Spiel, um zu verkaufen!"
          />
        </p>
      </div>
    </div>
  )
}