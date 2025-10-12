'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { SellListProvider, useSellListStore } from '@/context/SellListContext'
import LanguageToggle from '@/components/LanguageToggle'
import SellList from '@/components/SellList'
import SafeImage from '@/components/SafeImage'
import MTGCSVImporter from '@/components/MTGCSVImporter'
import SetIcon from '@/components/SetIcon'
import { useTranslations } from '@/lib/i18n'
import { searchMTGCards, getMTGCardPrints, getCardInLanguage, ScryfallCard, getCardImageUrl, getCardDisplayName } from '@/lib/api/scryfall'
import { isFeatureEnabled } from '@/lib/features'
import MoxfieldImporter from '@/components/MoxfieldImporter'
import { calculateBuyPrice, getPricingExplanation } from '@/lib/pricing'

interface GroupedCard {
  name: string
  displayName: string
  sets: Array<{
    code: string
    name: string
    marketPrice: number
    cardData: ScryfallCard
    germanData?: ScryfallCard
  }>
  imageUrl: string
  regularImageCard?: ScryfallCard
}

function MTGPageContent() {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const addItem = useSellListStore((state) => state.addItem)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<GroupedCard[]>([])
  const [selectedCard, setSelectedCard] = useState<GroupedCard | null>(null)
  const [selectedSet, setSelectedSet] = useState<any>(null)
  const [currentCardImage, setCurrentCardImage] = useState<string>('')
  const [currentCardData, setCurrentCardData] = useState<ScryfallCard | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSets, setIsLoadingSets] = useState(false)
  const [isLoadingGermanVersion, setIsLoadingGermanVersion] = useState(false)
  const [hoveredSet, setHoveredSet] = useState<any>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  const getCardTreatment = (card: ScryfallCard): string => {
    const treatments: string[] = []
    
    if (card.promo) {
      treatments.push(language === 'de' ? 'Promo' : 'Promo')
    }
    
    if (card.frame_effects) {
      if (card.frame_effects.includes('showcase')) {
        treatments.push(language === 'de' ? 'Showcase' : 'Showcase')
      }
      if (card.frame_effects.includes('extendedart')) {
        treatments.push(language === 'de' ? 'Extended Art' : 'Extended Art')
      }
      if (card.frame_effects.includes('borderless')) {
        treatments.push(language === 'de' ? 'Randlos' : 'Borderless')
      }
      if (card.frame_effects.includes('inverted')) {
        treatments.push(language === 'de' ? 'Invertiert' : 'Inverted')
      }
      if (card.frame_effects.includes('etched')) {
        treatments.push(language === 'de' ? 'Geätzt' : 'Etched')
      }
    }
    
    if (card.border_color === 'borderless') {
      if (!treatments.includes('Borderless') && !treatments.includes('Randlos')) {
        treatments.push(language === 'de' ? 'Randlos' : 'Borderless')
      }
    }
    
    if (card.finishes && card.finishes.length === 1 && card.finishes[0] === 'foil') {
      treatments.push(language === 'de' ? 'Nur Foil' : 'Foil Only')
    }
    
    if (card.set_type === 'masterpiece') {
      treatments.push(language === 'de' ? 'Meisterwerk' : 'Masterpiece')
    }
    
    if (treatments.length === 0) {
      return language === 'de' ? 'Normal' : 'Regular'
    }
    
    return treatments.join(' + ')
  }

  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setIsLoading(true)
    try {
      // Always search in English to ensure price data
      const results = await searchMTGCards(query, 'en')
      
      const resultsWithPrices = results.filter(card => {
        const hasEur = card.prices?.eur && card.prices.eur !== null && card.prices.eur !== 'null'
        const hasUsd = card.prices?.usd && card.prices.usd !== null && card.prices.usd !== 'null'
        return hasEur || hasUsd
      })
      
      const grouped = resultsWithPrices.reduce((acc: { [key: string]: GroupedCard }, card: ScryfallCard) => {
        const cardName = card.name.split(' // ')[0].trim()
        
        if (!acc[cardName]) {
          acc[cardName] = {
            name: cardName,
            displayName: cardName,
            sets: [],
            imageUrl: getCardImageUrl(card),
          }
        }
        
        const eurPrice = card.prices?.eur
        const usdPrice = card.prices?.usd
        
        let price = 0
        if (eurPrice && eurPrice !== 'null' && eurPrice !== null) {
          price = parseFloat(eurPrice)
        } else if (usdPrice && usdPrice !== 'null' && usdPrice !== null) {
          price = parseFloat(usdPrice) * 0.92
        }
        
        const marketPrice = isNaN(price) || price <= 0 ? 0.50 : price
        
        const existingSet = acc[cardName].sets.find(
          s => s.code === card.set.toUpperCase() && 
               s.cardData.collector_number === card.collector_number
        )
        
        if (!existingSet) {
          acc[cardName].sets.push({
            code: card.set.toUpperCase(),
            name: card.set_name,
            marketPrice: marketPrice,
            cardData: card,
          })
        }
        
        if (card.finishes?.includes('nonfoil') && !card.promo) {
          acc[cardName].imageUrl = getCardImageUrl(card)
        }
        
        return acc
      }, {})
      
      const groupedArray = Object.values(grouped).sort((a, b) => 
        a.displayName.localeCompare(b.displayName)
      )
      
      groupedArray.forEach(card => {
        card.sets.sort((a, b) => b.marketPrice - a.marketPrice)
      })
      
      setSearchResults(groupedArray)
    } catch (error) {
      console.error('Error searching MTG cards:', error)
      setSearchResults([])
    } finally {
      setIsLoading(false)
    }
  }

 const handleSelectCard = async (card: GroupedCard) => {
  setSelectedCard(card)
  setSelectedSet(null)
  setCurrentCardImage(card.imageUrl)
  setCurrentCardData(null)
  
  setIsLoadingSets(true)
  try {
    // Always fetch English versions for pricing
    const allPrints = await getMTGCardPrints(card.name, 'en')
    
    console.log('📦 All prints fetched:', allPrints.length)
    
    // Filter cards with prices AND log which ones are filtered
    const printsWithPrices = allPrints.filter(print => {
      const hasEur = print.prices?.eur && print.prices.eur !== null && print.prices.eur !== 'null'
      const hasUsd = print.prices?.usd && print.prices.usd !== null && print.prices.usd !== 'null'
      const hasPrices = hasEur || hasUsd
      
      if (!hasPrices) {
        console.log('⚠️ Filtered out (no price):', print.set, print.collector_number)
      }
      
      return hasPrices
    })
    
    console.log('💰 Prints with prices:', printsWithPrices.length)
    
    if (printsWithPrices.length === 0) {
      alert(language === 'de' 
        ? 'Keine Preise für diese Karte verfügbar.'
        : 'No pricing available for this card.'
      )
      setIsLoadingSets(false)
      return
    }
    
    // Map to set structure with better price handling
    const allSets = printsWithPrices.map((print: ScryfallCard) => {
      const eurPrice = print.prices?.eur
      const usdPrice = print.prices?.usd
      
      let price = 0
      
      // Try EUR first
      if (eurPrice && eurPrice !== 'null' && eurPrice !== null) {
        price = parseFloat(eurPrice)
        console.log(`💶 ${print.set} #${print.collector_number}: EUR ${eurPrice}`)
      } 
      // Fallback to USD
      else if (usdPrice && usdPrice !== 'null' && usdPrice !== null) {
        price = parseFloat(usdPrice) * 0.92
        console.log(`💵 ${print.set} #${print.collector_number}: USD ${usdPrice} → EUR ${price.toFixed(2)}`)
      }
      
      const marketPrice = isNaN(price) || price <= 0 ? 0.50 : price
      
      console.log(`📊 Final market price for ${print.set}: €${marketPrice.toFixed(2)}`)
      
      return {
        code: print.set.toUpperCase(),
        name: print.set_name,
        marketPrice: marketPrice,
        cardData: print,
      }
    })
    
    // Remove duplicates
    const uniqueSets = allSets.filter((set, index, self) =>
      index === self.findIndex((s) => 
        s.code === set.code && 
        s.cardData.collector_number === set.cardData.collector_number
      )
    )
    
    console.log(`✅ Total unique sets: ${uniqueSets.length}`)
    
    // Sort by price (highest first)
    uniqueSets.sort((a, b) => b.marketPrice - a.marketPrice)
    
    setSelectedCard({
      ...card,
      sets: uniqueSets,
    })
    
    if (uniqueSets.length > 0) {
      console.log('🎯 Loading first set:', uniqueSets[0].code, 'Price:', uniqueSets[0].marketPrice)
      await loadSetData(uniqueSets[0], card.name)
    }
  } catch (error) {
    console.error('❌ Error fetching all prints:', error)
    alert(language === 'de'
      ? 'Fehler beim Laden der Kartenversionen.'
      : 'Error loading card versions.'
    )
  } finally {
    setIsLoadingSets(false)
  }
}

  const loadSetData = async (set: any, cardName: string) => {
    setSelectedSet(set)
    
    if (language === 'de') {
      setIsLoadingGermanVersion(true)
      try {
        const germanCard = await getCardInLanguage(
          set.code,
          set.cardData.collector_number,
          'de'
        )
        
        if (germanCard) {
          set.germanData = germanCard
          setCurrentCardData(germanCard)
          setCurrentCardImage(getCardImageUrl(germanCard))
        } else {
          setCurrentCardData(set.cardData)
          setCurrentCardImage(getCardImageUrl(set.cardData))
        }
      } catch (error) {
        console.error('Error loading German version:', error)
        setCurrentCardData(set.cardData)
        setCurrentCardImage(getCardImageUrl(set.cardData))
      } finally {
        setIsLoadingGermanVersion(false)
      }
    } else {
      setCurrentCardData(set.cardData)
      setCurrentCardImage(getCardImageUrl(set.cardData))
    }
  }

  const handleSetChange = async (setCode: string, collectorNumber?: string) => {
    if (!selectedCard) return
    
    let set
    if (collectorNumber) {
      set = selectedCard.sets.find(
        (s) => s.code === setCode && s.cardData.collector_number === collectorNumber
      )
    } else {
      set = selectedCard.sets.find((s) => s.code === setCode)
    }
    
    if (set) {
      await loadSetData(set, selectedCard.name)
    }
  }

  const handleAddToSellList = () => {
    if (!selectedCard || !selectedSet) return

    const buyPrice = calculateBuyPrice(selectedSet.marketPrice)
    const displayName = currentCardData && language === 'de' 
      ? getCardDisplayName(currentCardData, true)
      : selectedCard.name

    addItem({
      id: `${selectedCard.name}-${selectedSet.code}-${Date.now()}`,
      cardName: displayName,
      setName: selectedSet.name,
      setCode: selectedSet.code,
      marketPrice: selectedSet.marketPrice,
      buyPrice: buyPrice,
      quantity: quantity,
      imageUrl: currentCardImage,
      tcg: 'Magic: The Gathering',
    })

    const message = language === 'de'
      ? `${quantity}x ${displayName} zur Verkaufsliste hinzugefügt!`
      : `Added ${quantity}x ${displayName} to sell list!`
    
    alert(message)
    setQuantity(1)
  }

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

  useEffect(() => {
    if (selectedCard && selectedSet) {
      loadSetData(selectedSet, selectedCard.name)
    }
  }, [language])

  return (
    <div className="min-h-screen bg-dark-blue">
      <header className="bg-dark-blue-light border-b border-yellow-accent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              <Link href="/">
                <img 
                  src='/SaltyCards-logo.jpg'
                  alt="Logo" 
                  className="w-10 h-10 sm:w-12 sm:h-12 cursor-pointer hover:opacity-80 transition-opacity flex-shrink-0"
                />
              </Link>
              <div className="min-w-0">
                <Link href="/" className="text-yellow-accent hover:text-yellow-dark text-xs sm:text-sm md:text-base block truncate">
                  ← {t('backToHome')}
                </Link>
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-accent mt-1 sm:mt-2 truncate">
                  Magic: The Gathering
                </h1>
                {language === 'de' && (
                  <p className="text-xs sm:text-sm text-gray-400 mt-1 hidden sm:block">
                    Deutsche Kartennamen und Artworks werden geladen, falls verfügbar
                  </p>
                )}
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        <div className="mb-4 sm:mb-6">
          <div className="bg-blue-900 bg-opacity-30 border border-blue-400 p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-blue-300">
              ℹ️ <strong>{language === 'de' ? 'Unverbindliches Angebot:' : 'Non-Binding Offer:'}</strong>{' '}
              {language === 'de'
                ? 'Die angezeigten Preise sind ein unverbindliches Angebot. Das endgültige Angebot wird nach Erhalt und Prüfung der Karten in unserem Shop erstellt.'
                : 'The displayed prices are a non-binding offer. The final offer will be made after receiving and inspecting the cards at our shop.'
              }
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div className="card p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent">
                  {t('search')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {isFeatureEnabled('enableCSVImport') && <MTGCSVImporter />}
                  <MoxfieldImporter />
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
                      {isLoadingGermanVersion ? (
                        <div className="flex items-center justify-center h-64 sm:h-96 bg-dark-blue rounded-lg">
                          <div className="text-gray-400 text-sm sm:text-base">{t('loading')}</div>
                        </div>
                      ) : currentCardImage && (
                        <SafeImage
                          key={`${selectedSet?.code}-${currentCardImage}-${language}`}
                          src={currentCardImage}
                          alt={currentCardData ? getCardDisplayName(currentCardData, language === 'de') : selectedCard.name}
                          className="rounded-lg w-full"
                          unoptimized
                        />
                      )}
                      {selectedSet && currentCardData && (
                        <div className="mt-2 text-center text-xs sm:text-sm text-gray-400">
                          {selectedSet.name} ({selectedSet.code})
                          {currentCardData.lang === 'de' && (
                            <span className="ml-2 text-yellow-accent">🇩🇪 Deutsche Version</span>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent mb-3 sm:mb-4 break-words">
                        {currentCardData && language === 'de' 
                          ? getCardDisplayName(currentCardData, true)
                          : selectedCard.name
                        }
                      </h2>
                      {currentCardData && language === 'de' && currentCardData.name !== getCardDisplayName(currentCardData, true) && (
                        <p className="text-xs sm:text-sm text-gray-400 mb-3 sm:mb-4">
                          {currentCardData.name}
                        </p>
                      )}

                      {isLoadingSets ? (
                        <div className="text-center text-gray-400 py-8 text-sm sm:text-base">
                          {t('loading')}
                        </div>
                      ) : (
                        <>
                          <div className="mb-4">
                            <label className="block text-xs sm:text-sm font-semibold mb-2">
                              {t('selectSet')} ({selectedCard.sets.length} {t('available')})
                            </label>
                            
                            <div className="mt-2 max-h-64 overflow-y-auto border border-gray-700 rounded bg-dark-blue">
                              {selectedCard.sets.map((set) => {
                                const treatment = getCardTreatment(set.cardData)
                                const isSpecial = treatment !== 'Regular' && treatment !== 'Normal'
                                const rarity = set.cardData.rarity
                                const isSelected = selectedSet?.code === set.code && 
                                                  selectedSet?.cardData.collector_number === set.cardData.collector_number
                                
                                return (
                                  <div
                                    key={`${set.code}-${set.cardData.collector_number}`}
                                    onClick={() => handleSetChange(set.code, set.cardData.collector_number)}
                                    onMouseEnter={(e) => {
                                      setHoveredSet(set)
                                      const rect = e.currentTarget.getBoundingClientRect()
                                      setMousePosition({ 
                                        x: rect.right + 10, 
                                        y: rect.top 
                                      })
                                    }}
                                    onMouseLeave={() => setHoveredSet(null)}
                                    className={`p-2 border-b border-gray-700 cursor-pointer hover:bg-dark-blue-light transition-colors ${
                                      isSelected ? 'bg-dark-blue-light border-l-4 border-l-yellow-accent' : ''
                                    }`}
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className="flex-shrink-0 bg-white rounded p-1.5 flex items-center justify-center" style={{ width: '32px', height: '32px' }}>
                                        <SetIcon 
                                          setCode={set.code.toLowerCase()} 
                                          rarity={rarity}
                                          size="medium"
                                        />
                                      </div>
                                      
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-xs truncate">
                                          {set.name}
                                          {isSpecial && <span className="ml-1 text-xs">✨</span>}
                                        </div>
                                        <div className="text-xs text-gray-400 flex items-center gap-2">
                                          <span>{set.code.toUpperCase()}</span>
                                          <span className="text-gray-600">•</span>
                                          <span>#{set.cardData.collector_number}</span>
                                          {treatment !== 'Regular' && treatment !== 'Normal' && (
                                            <>
                                              <span className="text-gray-600">•</span>
                                              <span className="text-yellow-accent text-xs">{treatment}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )
                              })}
                            </div>

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
        src={getCardImageUrl(hoveredSet.cardData)}
        alt={hoveredSet.cardData.name}
        className="rounded"
        style={{ width: '200px', height: 'auto' }}
        unoptimized
      />
      <div className="text-xs text-center text-gray-300 mt-2 font-semibold">
        {hoveredSet.name}
      </div>
      <div className="text-xs text-center text-gray-500">
        {hoveredSet.code.toUpperCase()} #{hoveredSet.cardData.collector_number}
      </div>
    </div>
  </div>
)}
                          </div>

                          {selectedSet && !isLoadingGermanVersion && (
                            <div className="space-y-3 sm:space-y-4">
                              <div className="bg-yellow-accent text-black p-3 sm:p-4 rounded">
  <div className="text-xs sm:text-sm font-semibold">
    {t('estimatedBuyPrice')}
  </div>
  <div className="text-2xl sm:text-3xl font-bold">
    €{calculateBuyPrice(selectedSet.marketPrice).toFixed(2)}
  </div>
  
  {/* DEBUG INFO - REMOVE AFTER TESTING */}
  <div className="text-xs mt-2 bg-black text-white p-2 rounded">
    <div>Market: €{selectedSet.marketPrice.toFixed(2)}</div>
    <div>Tier: {
      selectedSet.marketPrice >= 3 ? '50% (€3+)' :
      selectedSet.marketPrice >= 0.5 ? '10% (€0.50-2.99)' :
      '¼¢ (under €0.50)'
    }</div>
    <div>Calculated: €{calculateBuyPrice(selectedSet.marketPrice).toFixed(4)}</div>
  </div>
  
  <div className="text-xs mt-1 opacity-80">
    {t('pricePerCard')}
  </div>
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

                              <button 
                                onClick={handleAddToSellList} 
                                className="btn-primary w-full text-sm sm:text-base py-3"
                              >
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

export default function MTGPage() {
  return (
    <LanguageProvider>
      <SellListProvider>
        <MTGPageContent />
      </SellListProvider>
    </LanguageProvider>
  )
}