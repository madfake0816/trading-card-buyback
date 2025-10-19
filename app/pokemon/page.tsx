'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import LanguageToggle from '@/components/LanguageToggle'
import SellList from '@/components/SellList'
import SafeImage from '@/components/SafeImage'
import { useTranslations } from '@/lib/i18n'
import {
  searchPokemonCards,
  getPokemonCardPrints,
  getPokemonCardImage,
  getPokemonCardDisplayName,
  type UnifiedPrint as PokemonPrint,
} from '@/lib/api/pokemon'
import { isFeatureEnabled } from '@/lib/features'
import { calculateBuyPrice, getPricingExplanation } from '@/lib/pricing'
import { useSellListStore } from '@/context/SellListContext'

/** Interne Darstellung pro Ergebnis-Gruppe (Name → Sets/Prints) */
interface GroupedCard {
  name: string
  displayName: string
  sets: Array<{
    code: string
    name: string
    marketPrice: number
    cardData: PokemonPrint
  }>
  imageUrl: string
  regularImageCard?: PokemonPrint
  collectorNumber?: string
}

/** Marktpreis aus dem unified Pokemon-Print entnehmen (EUR) */
function getPokemonMarketPrice(print: PokemonPrint): number {
  return typeof print.prices?.market === 'number' ? print.prices.market : 0
}

/** Für das Set-Icon verwenden wir das Symbol-Bild aus der API, wenn vorhanden */
function getSetSymbolUrl(print: PokemonPrint): string | null {
  // In unserer unified Struktur liegt das Set-Logo/Symbol nicht direkt – wir nutzen daher kein externes SetIcon,
  // sondern zeigen hier bewusst keins an (oder du ergänzt deine Struktur um set.images.symbol).
  // Falls du set.images.symbol in die UnifiedPrint-Struktur ergänzt, kannst du es hier verwenden.
  return null
}

function PokemonPageContent() {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const addItem = useSellListStore((state) => state.addItem)

  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GroupedCard[]>([])
  const [selectedCard, setSelectedCard] = useState<GroupedCard | null>(null)
  const [selectedSet, setSelectedSet] = useState<GroupedCard['sets'][number] | null>(null)
  const [currentCardImage, setCurrentCardImage] = useState<string>('')
  const [currentCardData, setCurrentCardData] = useState<PokemonPrint | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [hoveredSet, setHoveredSet] = useState<GroupedCard['sets'][number] | null>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  /** Suche */
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      const results = await searchPokemonCards(query)

      // Gruppieren nach Kartenname
      const grouped = results.reduce((acc: Record<string, GroupedCard>, print: PokemonPrint) => {
        const cardName = print.name.trim()

        if (!acc[cardName]) {
          acc[cardName] = {
            name: cardName,
            displayName: cardName,
            sets: [],
            imageUrl: getPokemonCardImage(print),
          }
        }

        const price = getPokemonMarketPrice(print)

        // Mindestens einen Eintrag pro Name behalten
        if (price > 0 || acc[cardName].sets.length === 0) {
          acc[cardName].sets.push({
            code: (print.set?.code || '').toUpperCase(),
            name: print.set?.name,
            marketPrice: price,
            cardData: print,
          })
        }
        return acc
      }, {})

      setSearchResults(Object.values(grouped))
    } catch (error) {
     console.error('Pokemon route error FULL:', error, JSON.stringify(error, null, 2))

      alert(language === 'de' ? 'Suchfehler. Bitte erneut versuchen.' : 'Search error. Please try again.')
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

  /** Auswahl einer Karte → Prints laden */
  const handleSelectCard = async (card: GroupedCard) => {
    setSelectedCard(card)
    setSelectedSet(null)
    setCurrentCardImage(card.imageUrl)
    setCurrentCardData(null)

    setIsLoadingSets(true)
    try {
      // Alle Prints/Varianten (verschiedene Sets / Nummern)
      const allPrints = await getPokemonCardPrints(card.name)

      // Filtern: irgendein valider Preis/Markt
      const printsWithPrices = allPrints.filter((p) => getPokemonMarketPrice(p) > 0)

      if (printsWithPrices.length === 0) {
        alert(language === 'de' ? `Keine Preise für ${card.name} verfügbar.` : `No pricing available for ${card.name}.`)
        setIsLoadingSets(false)
        return
      }

      const allSets = printsWithPrices.map((print) => {
        const price = getPokemonMarketPrice(print)
        return {
          code: (print.set?.code || '').toUpperCase(),
          name: print.set?.name,
          marketPrice: price,
          cardData: print,
        }
      })

      // Deduplizieren: (set code + collector number)
      const uniqueSets = allSets.filter((set, index, self) => {
        const key = `${set.code}-${set.cardData.number}`
        return index === self.findIndex((s) => `${s.code}-${s.cardData.number}` === key)
      })

      // Sortierung: höchster Marktpreis zuerst
      uniqueSets.sort((a, b) => b.marketPrice - a.marketPrice)

      setSelectedCard({
        ...card,
        sets: uniqueSets,
      })

      if (uniqueSets.length > 0) {
        await loadSetData(uniqueSets[0], card.name)
      }
    } catch (error) {
      console.error('Error loading Pokémon prints:', error)
      alert(language === 'de' ? 'Fehler beim Laden der Drucke' : 'Error loading prints')
    } finally {
      setIsLoadingSets(false)
    }
  }

  /** Set/Print laden → Bild + Daten setzen */
  const loadSetData = async (set: GroupedCard['sets'][number], _cardName: string) => {
    setSelectedSet(set)
    setCurrentCardData(set.cardData)
    setCurrentCardImage(getPokemonCardImage(set.cardData))
  }

  /** Wechsel zwischen Prints */
  const handleSetChange = async (setCode: string, collectorNumber?: string) => {
    if (!selectedCard) return

    let found: GroupedCard['sets'][number] | undefined
    if (collectorNumber) {
      found = selectedCard.sets.find(
        (s) => s.code === setCode && s.cardData.number === collectorNumber
      )
    } else {
      found = selectedCard.sets.find((s) => s.code === setCode)
    }

    if (found) {
      await loadSetData(found, selectedCard.name)
    }
  }

  /** In SellList übernehmen */
  const handleAddToSellList = () => {
    if (!selectedCard || !selectedSet || !currentCardData) return

    const buyPrice = calculateBuyPrice(selectedSet.marketPrice)
    const displayName = getPokemonCardDisplayName(currentCardData)

    addItem({
      id: `${selectedCard.name}-${selectedSet.code}-${Date.now()}`,
      cardName: displayName,
      setName: selectedSet.name,
      setCode: selectedSet.code,
      marketPrice: selectedSet.marketPrice,
      buyPrice: buyPrice,
      quantity: quantity,
      imageUrl: currentCardImage,
      tcg: 'Pokémon TCG',

      // Pflichtfelder aus SellListItem:
      collectorNumber: currentCardData.number ?? '',
      condition: 'NM',
      language: 'English',
      foil: false,
    })

    const message =
      language === 'de'
        ? `${quantity}x ${displayName} zur Verkaufsliste hinzugefügt!`
        : `Added ${quantity}x ${displayName} to sell list!`

    console.log(message)
    setQuantity(1)
  }

  /** Debounce Suche */
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchQuery && searchQuery.length >= 2) {
        handleSearch(searchQuery)
      } else if (searchQuery.length < 2) {
        setSearchResults([])
      }
    }, 800)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="min-h-screen bg-dark-blue">
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="bg-blue-900 bg-opacity-30 border border-blue-400 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-300">
              ℹ️ <strong>{language === 'de' ? 'Unverbindliches Angebot:' : 'Non-Binding Offer:'}</strong>{' '}
              {language === 'de'
                ? 'Die angezeigten Preise sind ein unverbindliches Angebot. Das endgültige Angebot wird nach Erhalt und Prüfung der Karten in unserem Shop erstellt.'
                : 'The displayed prices are a non-binding offer. The final offer will be made after receiving and inspecting the cards at our shop.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="card p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent">{t('search')}</h2>
                <div className="flex flex-wrap gap-2">
                  {/* Pokémon-Importer ggf. später: */}
                  {/* {isFeatureEnabled('enableCSVImport') && <PokemonCSVImporter />} */}
                </div>
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  if (e.target.value.length < 2) {
                    setSelectedCard(null)
                    setSelectedSet(null)
                    setCurrentCardImage('')
                    setCurrentCardData(null)
                  }
                }}
                placeholder={t('searchPlaceholder')}
                className="input-field w-full text-sm sm:text-base"
              />
              {isLoading && (
                <div className="text-center text-gray-400 mt-4 text-sm sm:text-base">
                  {t('loading')}
                </div>
              )}
            </div>

            {searchResults.length > 0 && !selectedCard && (
              <div className="card p-3 sm:p-4 md:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-yellow-accent mb-3 sm:mb-4">
                  {t('searchResults')} ({searchResults.length})
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                  {searchResults.map((card) => (
                    <button
                      key={`${card.name}-${card.sets[0]?.code || 'unknown'}`}
                      onClick={() => handleSelectCard(card)}
                      className="bg-dark-blue p-2 sm:p-3 rounded hover:border hover:border-yellow-accent transition-all text-left"
                    >
                      {card.imageUrl && (
                        <SafeImage
                          src={card.imageUrl}
                          alt={card.displayName}
                          className="w-full rounded mb-2"
                          unoptimized
                        />
                      )}
                      <div className="text-xs sm:text-sm font-semibold truncate">
                        {card.displayName}
                      </div>
                      <div className="text-xs text-gray-400">
                        {card.sets.length} {card.sets.length === 1 ? t('printing') : t('printings')}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selectedCard && (
              <div>
                <button
                  onClick={() => {
                    setSelectedCard(null)
                    setSelectedSet(null)
                    setCurrentCardImage('')
                    setCurrentCardData(null)
                  }}
                  className="btn-secondary mb-3 sm:mb-4 w-full sm:w-auto"
                >
                  ← {t('backToResults')}
                </button>

                <div className="card p-3 sm:p-4 md:p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      {currentCardImage && (
                        <SafeImage
                          key={`${selectedSet?.code}-${currentCardImage}-${language}`}
                          src={currentCardImage}
                          alt={currentCardData ? getPokemonCardDisplayName(currentCardData) : selectedCard.name}
                          className="rounded-lg w-full"
                          unoptimized
                        />
                      )}
                      {selectedSet && currentCardData && (
                        <div className="mt-2 text-center text-xs sm:text-sm text-gray-400">
                          {selectedSet.name} ({selectedSet.code})
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent mb-3 sm:mb-4 break-words">
                        {currentCardData ? getPokemonCardDisplayName(currentCardData) : selectedCard.name}
                      </h2>

                      {isLoadingSets ? (
                        <div className="text-center text-gray-400 py-8 text-sm sm:text-base">{t('loading')}</div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <label className="block text-xs sm:text-sm font-semibold mb-2">
                              {t('selectSet')} ({selectedCard.sets.length} {t('available')})
                            </label>

                            {/* Liste der Prints/Sets */}
                            <div
                              className="mt-2 max-h-64 overflow-y-auto border border-gray-700 rounded bg-dark-blue"
                              onMouseLeave={() => setHoveredSet(null)}
                            >
                              {selectedCard.sets.map((set) => {
                                const isSelected =
                                  selectedSet?.code === set.code &&
                                  selectedSet?.cardData.number === set.cardData.number

                                return (
                                  <div
                                    key={`${set.code}-${set.cardData.number}`}
                                    onClick={() => handleSetChange(set.code, set.cardData.number)}
                                    onMouseEnter={(e) => {
                                      setHoveredSet(set)
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setMousePosition({ x: rect.right + 10, y: rect.top })
                                    }}
                                    className={`p-2 border-b border-gray-700 cursor-pointer hover:bg-dark-blue-light transition-colors ${
                                      isSelected ? 'bg-dark-blue-light border-l-4 border-l-yellow-accent' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      {/* Set-Symbol (optional, siehe Kommentar in getSetSymbolUrl) */}
                                      <div
                                        className="flex-shrink-0 bg-white rounded p-1.5 flex items-center justify-center"
                                        style={{ width: '32px', height: '32px' }}
                                      >
                                        {/* Wenn du das Set-Symbol in UnifiedPrint.set integrierst, hier anzeigen */}
                                        <div className="w-6 h-6 rounded bg-gray-300" />
                                      </div>

                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-xs truncate">{set.name}</div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                          <span>{set.code.toUpperCase()}</span>
                                          <span className="text-gray-600">•</span>
                                          <span>#{set.cardData.number}</span>
                                        </div>
                                      </div>

                                      <div className="text-xs font-semibold text-emerald-400">
                                        €{set.marketPrice.toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

                            {/* Hover-Preview */}
                            {hoveredSet && (
                              <div
                                className="fixed z-[9999] pointer-events-none"
                                style={{
                                  left: `${mousePosition.x}px`,
                                  top: `${Math.max(20, mousePosition.y - 150)}px`,
                                }}
                              >
                                <div className="bg-dark-blue border-2 border-yellow-accent rounded-lg p-2 shadow-2xl">
                                  <SafeImage
                                    key={`${hoveredSet.code}-${hoveredSet.cardData.number}`}
                                    src={getPokemonCardImage(hoveredSet.cardData)}
                                    alt={hoveredSet.cardData.name}
                                    className="rounded"
                                    style={{ width: '200px', height: 'auto' }}
                                    unoptimized
                                  />
                                  <div className="text-xs text-center text-gray-300 mt-2 font-semibold">
                                    {hoveredSet.name}
                                  </div>
                                  <div className="text-xs text-center text-gray-500">
                                    {hoveredSet.code.toUpperCase()} #{hoveredSet.cardData.number}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>

                          {selectedSet && (
                            <div className="space-y-3 sm:space-y-4">
                              <div className="bg-yellow-accent text-black p-3 sm:p-4 rounded">
                                <div className="text-xs sm:text-sm font-semibold">{t('estimatedBuyPrice')}</div>
                                <div className="text-2xl sm:text-3xl font-bold">
                                  €{calculateBuyPrice(selectedSet.marketPrice).toFixed(2)}
                                </div>

                                {/* Debug/Info Box wie in MTG */}
                                <div className="text-xs mt-2 bg-black text-white p-2 rounded">
                                  <div>Market: €{selectedSet.marketPrice.toFixed(2)}</div>
                                  <div>
                                    Calculated: €{calculateBuyPrice(selectedSet.marketPrice).toFixed(4)}
                                  </div>
                                </div>

                                <div className="text-xs mt-1 opacity-80">{t('pricePerCard')}</div>
                                <div className="text-xs mt-2 opacity-70">
                                  {getPricingExplanation(selectedSet.marketPrice, language)}
                                </div>
                              </div>

                              <div>
                                <label className="block text-xs sm:text-sm font-semibold mb-2">
                                  {t('quantity')}
                                </label>
                                <input
                                  type="number"
                                  min="1"
                                  value={quantity}
                                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                                  className="input-field w-full text-sm sm:text-base"
                                />
                              </div>

                              <button onClick={handleAddToSellList} className="btn-primary w-full text-sm sm:text-base py-3">
                                {t('addToSellList')}
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <SellList />
          </div>
        </div>
      </main>
    </div>
  )
}

export default function PokemonPage() {
  return <PokemonPageContent />
}
