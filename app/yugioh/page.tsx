'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import TranslatedText from '@/components/TranslatedText'
import { useSellListStore } from '@/context/SellListContext'
import { calculateBuyPrice } from '@/lib/pricing'
import SafeImage from '@/components/SafeImage'
import { 
  searchYugiohCards, 
  getYugiohCardPrice, 
  getYugiohCardImage,
  groupYugiohCardsBySet,
  type YugiohCard 
} from '@/lib/api/yugioh'

export default function YugiohPage() {
  const { language } = useLanguage()
  const { addItem } = useSellListStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<YugiohCard[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedCard, setSelectedCard] = useState<YugiohCard | null>(null)
  const [quantity, setQuantity] = useState(1)

  const handleSearch = async () => {
    if (!searchQuery || searchQuery.length < 2) {
      alert('Please enter at least 2 characters')
      return
    }

    setSearching(true)
    setSelectedCard(null)

    try {
      const results = await searchYugiohCards(searchQuery)
      
      // Filter cards with prices
      const cardsWithPrices = results.filter(card => getYugiohCardPrice(card) > 0)
      
      setSearchResults(cardsWithPrices)
      
      if (cardsWithPrices.length === 0) {
        alert('No cards found with prices. Try a different search.')
      }
    } catch (error) {
      console.error('Search error:', error)
      alert('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const handleAddToList = (card: YugiohCard, setCode?: string, setName?: string, setPrice?: number) => {
    const marketPrice = setPrice || getYugiohCardPrice(card)
    const buyPrice = calculateBuyPrice(marketPrice)

    addItem({
      id: `${card.id}-${setCode || 'base'}-${Date.now()}`,
      cardName: card.name,
      setName: setName || 'Base Set',
      setCode: setCode || 'BASE',
      marketPrice: marketPrice,
      buyPrice: buyPrice,
      quantity: quantity,
      imageUrl: getYugiohCardImage(card),
      tcg: 'Yu-Gi-Oh!',
      condition: 'NM',
      language: 'en',
      foil: false
    })

    alert(`Added ${quantity}x ${card.name} to your sell list!`)
    setQuantity(1)
  }

  return (
    <div className="min-h-screen bg-[#0a0e14] py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
            Yu-Gi-Oh! Buyback
          </h1>
          <p className="text-gray-400 text-lg">
            <TranslatedText
              en="Search for Yu-Gi-Oh! cards and get instant buyback prices"
              de="Suchen Sie nach Yu-Gi-Oh!-Karten und erhalten Sie sofortige Ankaufspreise"
            />
          </p>
        </div>

        {/* Search Bar */}
        <div className="card p-6 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for Yu-Gi-Oh! cards... (e.g., Dark Magician, Blue-Eyes)"
              className="input-field flex-1"
              disabled={searching}
            />
            <button
              onClick={handleSearch}
              disabled={searching}
              className="btn-primary whitespace-nowrap"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && !selectedCard && (
          <div className="card p-6 mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">
              <TranslatedText
                en={`Found ${searchResults.length} cards`}
                de={`${searchResults.length} Karten gefunden`}
              />
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {searchResults.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className="card p-3 hover:scale-105 transition-all text-left"
                >
                  <SafeImage
                    src={getYugiohCardImage(card)}
                    alt={card.name}
                    className="w-full rounded mb-2"
                    unoptimized
                  />
                  <h3 className="font-bold text-sm text-white truncate">
                    {card.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {card.type}
                  </p>
                  <p className="text-sm font-bold text-blue-400 mt-1">
                    €{getYugiohCardPrice(card).toFixed(2)}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Card Details */}
        {selectedCard && (
          <div className="space-y-6">
            <button
              onClick={() => setSelectedCard(null)}
              className="btn-outline"
            >
              ← Back to Results
            </button>

            <div className="card p-6">
              <h2 className="text-3xl font-bold text-white mb-6">
                {selectedCard.name}
              </h2>

              <div className="grid md:grid-cols-3 gap-6 mb-6">
                <div className="md:col-span-1">
                  <SafeImage
                    src={getYugiohCardImage(selectedCard)}
                    alt={selectedCard.name}
                    className="w-full rounded-lg"
                    unoptimized
                  />
                </div>

                <div className="md:col-span-2">
                  <div className="space-y-4">
                    <div>
                      <span className="text-gray-400">Type:</span>
                      <span className="ml-2 text-white font-semibold">{selectedCard.type}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Race:</span>
                      <span className="ml-2 text-white font-semibold">{selectedCard.race}</span>
                    </div>
                    {selectedCard.attribute && (
                      <div>
                        <span className="text-gray-400">Attribute:</span>
                        <span className="ml-2 text-white font-semibold">{selectedCard.attribute}</span>
                      </div>
                    )}
                    {selectedCard.level !== undefined && (
                      <div>
                        <span className="text-gray-400">Level:</span>
                        <span className="ml-2 text-white font-semibold">{selectedCard.level}</span>
                      </div>
                    )}
                    {selectedCard.atk !== undefined && (
                      <div>
                        <span className="text-gray-400">ATK/DEF:</span>
                        <span className="ml-2 text-white font-semibold">
                          {selectedCard.atk} / {selectedCard.def}
                        </span>
                      </div>
                    )}
                    {selectedCard.archetype && (
                      <div>
                        <span className="text-gray-400">Archetype:</span>
                        <span className="ml-2 text-white font-semibold">{selectedCard.archetype}</span>
                      </div>
                    )}
                    <div className="pt-4">
                      <p className="text-gray-400 text-sm">{selectedCard.desc}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Available Sets */}
              {selectedCard.card_sets && selectedCard.card_sets.length > 0 ? (
                <div>
                  <h3 className="text-xl font-bold text-white mb-4">
                    <TranslatedText
                      en="Available Sets"
                      de="Verfügbare Sets"
                    />
                  </h3>

                  <div className="grid gap-3">
                    {groupYugiohCardsBySet(selectedCard).map((set, index) => {
                      const buyPrice = calculateBuyPrice(set.price)

                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between bg-[#1a2029] p-4 rounded-lg"
                        >
                          <div>
                            <p className="font-semibold text-white">{set.setName}</p>
                            <p className="text-sm text-gray-400">
                              {set.setCode} • {set.rarity}
                            </p>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-sm text-gray-400">Market</p>
                              <p className="text-lg font-bold text-white">
                                €{set.price.toFixed(2)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-400">We Pay</p>
                              <p className="text-lg font-bold text-green-400">
                                €{buyPrice.toFixed(2)}
                              </p>
                            </div>
                            <button
                              onClick={() => handleAddToList(selectedCard, set.setCode, set.setName, set.price)}
                              className="btn-primary text-sm"
                            >
                              Add to List
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-[#1a2029] p-6 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">Base Set</p>
                      <p className="text-sm text-gray-400">Standard Edition</p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Market</p>
                        <p className="text-lg font-bold text-white">
                          €{getYugiohCardPrice(selectedCard).toFixed(2)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">We Pay</p>
                        <p className="text-lg font-bold text-green-400">
                          €{calculateBuyPrice(getYugiohCardPrice(selectedCard)).toFixed(2)}
                        </p>
                      </div>
                      <button
                        onClick={() => handleAddToList(selectedCard)}
                        className="btn-primary text-sm"
                      >
                        Add to List
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
    {/* Empty State */}
    {searchResults.length === 0 && !searching && (
      <div className="card p-12 text-center">
        <div className="text-6xl mb-4">🎴</div>
        <h3 className="text-2xl font-bold text-white mb-2">
          <TranslatedText
            en="Search for Yu-Gi-Oh! Cards"
            de="Suche nach Yu-Gi-Oh!-Karten"
          />
        </h3>
        <p className="text-gray-400">
          <TranslatedText
            en="Enter a card name to see buyback prices"
            de="Geben Sie einen Kartennamen ein, um Ankaufspreise zu sehen"
          />
        </p>
      </div>
    )}
  </div>
</div>
)
}
