'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { SellListProvider, useSellListStore } from '@/context/SellListContext'
import LanguageToggle from '@/components/LanguageToggle'
import SellList from '@/components/SellList'
import SafeImage from '@/components/SafeImage'
import MTGCSVImporter from '@/components/MTGCSVImporter'
// REMOVED: import CardScanner from '@/components/CardScanner'
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
  regularImageCard?: ScryfallCard  // Add this
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
  const getCardTreatment = (card: ScryfallCard): string => {
    const treatments: string[] = []
    
    // Check for promo
    if (card.promo) {
      treatments.push(language === 'de' ? 'Promo' : 'Promo')
    }
    
    // Check for special frames
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
    
    // Check border color
    if (card.border_color === 'borderless') {
      if (!treatments.includes('Borderless') && !treatments.includes('Randlos')) {
        treatments.push(language === 'de' ? 'Randlos' : 'Borderless')
      }
    }
    
    // Check for foil-only
    if (card.finishes && card.finishes.length === 1 && card.finishes[0] === 'foil') {
      treatments.push(language === 'de' ? 'Nur Foil' : 'Foil Only')
    }
    
    // Check for special set types
    if (card.set_type === 'masterpiece') {
      treatments.push(language === 'de' ? 'Meisterwerk' : 'Masterpiece')
    }
    
    // If no special treatment found, it's regular
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
    const results = await searchMTGCards(query, language)
    
    console.log('📦 Raw results:', results.length)
    
    // For German cards, fetch English versions to get prices
    let processedResults = results
    
    if (language === 'de' && results.length > 0) {
      console.log('🇩🇪 Fetching English prices for German cards...')
      
      const cardsWithPrices = await Promise.all(
        results.map(async (germanCard) => {
          // If German card already has a price, use it
          const hasPrice = (germanCard.prices?.eur && germanCard.prices.eur !== 'null') ||
                          (germanCard.prices?.usd && germanCard.prices.usd !== 'null')
          
          if (hasPrice) {
            console.log('  ✅', germanCard.printed_name || germanCard.name, 'has price')
            return germanCard
          }
          
          // Otherwise, fetch English version to get price
          try {
            console.log('  🔄 Fetching English price for:', germanCard.printed_name || germanCard.name)
            const englishCard = await getCardInLanguage(germanCard.set, germanCard.collector_number, 'en')
            
            if (englishCard && englishCard.prices) {
              // Copy prices from English card to German card
              return {
                ...germanCard,
                prices: englishCard.prices
              }
            }
          } catch (error) {
            console.log('  ⚠️ Could not fetch English price, using fallback')
          }
          
          return germanCard
        })
      )
      
      processedResults = cardsWithPrices
      console.log('✅ Prices fetched for German cards')
    }
    
    // Now filter by price
    const resultsWithPrices = processedResults.filter(card => {
      const hasEur = card.prices?.eur && card.prices.eur !== null && card.prices.eur !== 'null'
      const hasUsd = card.prices?.usd && card.prices.usd !== null && card.prices.usd !== 'null'
      return hasEur || hasUsd
    })
    
    console.log('💰 Results with prices:', resultsWithPrices.length)
    
    const grouped = resultsWithPrices.reduce((acc: { [key: string]: GroupedCard }, card: ScryfallCard) => {
      const cardName = card.name.split(' // ')[0].trim()
      const displayName = getCardDisplayName(card, language === 'de')
      
      if (!acc[cardName]) {
        acc[cardName] = {
          name: cardName,
          displayName: displayName.split(' // ')[0].trim(),
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
    
    console.log('📊 Final grouped results:', groupedArray.length)
    
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
  
  if (card.sets.length < 5) {
    setIsLoadingSets(true)
    try {
      const allPrints = await getMTGCardPrints(card.name, language)
      
      // Filter out cards without prices
      const printsWithPrices = allPrints.filter(print => {
        const hasEur = print.prices?.eur && print.prices.eur !== null && print.prices.eur !== 'null'
        const hasUsd = print.prices?.usd && print.prices.usd !== null && print.prices.usd !== 'null'
        return hasEur || hasUsd
      })
      
      // Map to our set structure
      const allSets = printsWithPrices.map((print: ScryfallCard) => {
        const price = parseFloat(print.prices.eur || print.prices.usd || '0')
        const marketPrice = isNaN(price) || price <= 0 ? 0.50 : price
        
        return {
          code: print.set.toUpperCase(),
          name: print.set_name,
          marketPrice: marketPrice,
          cardData: print,
        }
      })
      
      // Only remove EXACT duplicates (same set + same collector number)
      // Keep different treatments (showcase, extended art, etc.)
      const uniqueSets = allSets.filter((set, index, self) =>
        index === self.findIndex((s) => 
          s.code === set.code && 
          s.cardData.collector_number === set.cardData.collector_number
        )
      )
      
      console.log(`Total versions: ${uniqueSets.length}`)
      
      // Sort by price (highest first)
      uniqueSets.sort((a, b) => b.marketPrice - a.marketPrice)
      
      setSelectedCard({
        ...card,
        sets: uniqueSets,
      })
      
      if (uniqueSets.length > 0) {
        await loadSetData(uniqueSets[0], card.name)
      }
    } catch (error) {
      console.error('Error fetching all prints:', error)
      if (card.sets.length > 0) {
        await loadSetData(card.sets[0], card.name)
      }
    } finally {
      setIsLoadingSets(false)
    }
  } else {
    if (card.sets.length > 0) {
      await loadSetData(card.sets[0], card.name)
    }
  }
}

  const loadSetData = async (set: any, cardName: string) => {
  console.log('=== LOAD SET DATA DEBUG ===')
  console.log('Loading set:', set)
  console.log('Set marketPrice:', set.marketPrice)
  console.log('Set marketPrice type:', typeof set.marketPrice)
  
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
        console.log('German card found:', {
          name: germanCard.name,
          prices: germanCard.prices
        })
        
        set.germanData = germanCard
        setCurrentCardData(germanCard)
        setCurrentCardImage(getCardImageUrl(germanCard))
      } else {
        console.log('No German version, using English')
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
  
  console.log('Final selectedSet after loadSetData:', set)
}

  const handleSetChange = async (setCode: string, collectorNumber?: string) => {
  if (!selectedCard) return
  
  let set
  if (collectorNumber) {
    // Find by both set code and collector number
    set = selectedCard.sets.find(
      (s) => s.code === setCode && s.cardData.collector_number === collectorNumber
    )
  } else {
    // Fallback to just set code (old behavior)
    set = selectedCard.sets.find((s) => s.code === setCode)
  }
  
  if (set) {
    await loadSetData(set, selectedCard.name)
  }
}

  const handleAddToSellList = () => {
  if (!selectedCard || !selectedSet) return

  

  const buyPrice = calculateBuyPrice(selectedSet.marketPrice)  // ← NEW

  console.log('=== PRICING DEBUG ===')
  console.log('Market Price:', selectedSet.marketPrice)
  console.log('Calculated Buy Price:', buyPrice)
  console.log('Old Buy Price (70%):', selectedSet.marketPrice * 0.7)
  console.log('===================')
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
      {/* Mobile-optimized header */}
      <header className="bg-dark-blue-light border-b border-yellow-accent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Logo */}
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
        {/* Important Notices */}
        <div className="mb-4 sm:mb-6 space-y-2 sm:space-y-3">
          <div className="bg-yellow-accent bg-opacity-20 border border-yellow-accent p-3 sm:p-4 rounded-lg">
            <p className="text-xs sm:text-sm text-yellow-accent">
              ⚠️ <strong>{language === 'de' ? 'Hinweis:' : 'Notice:'}</strong>{' '}
              {language === 'de'
                ? 'Alle Preise gelten für Karten in Near Mint (NM) Zustand. Bei niedrigerer Qualität werden die Preise entsprechend angepasst.'
                : 'All prices are for Near Mint (NM) condition cards. Prices will be adjusted accordingly for lower condition cards.'
              }
            </p>
          </div>
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

        {/* Mobile-first grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            {/* Search Card */}
            <div className="card p-3 sm:p-4 md:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent">
                  {t('search')}
                </h2>
                <div className="flex gap-2 w-full sm:w-auto">
                  {/* REMOVED: Scanner button */}
                  
                  {/* Only show CSV importer if feature is enabled */}
                 <div className="flex flex-wrap gap-3 mb-6">
                  {isFeatureEnabled('enableCSVImport') && <MTGCSVImporter />}
                  <MoxfieldImporter />
                </div>
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
                placeholder={language === 'de' ? 'Kartenname (Deutsch oder Englisch)...' : t('searchPlaceholder')}
                className="input-field w-full text-sm sm:text-base"
              />
              {language === 'de' && isFeatureEnabled('enableGermanLanguage') && (
                <p className="text-xs text-gray-400 mt-2">
                  💡 Sie können sowohl deutsche als auch englische Kartennamen verwenden
                </p>
              )}
              {isLoading && (
                <div className="text-center text-gray-400 mt-4 text-sm sm:text-base">
                  {t('loading')}
                </div>
              )}
            </div>

            {/* Search Results - Mobile optimized grid */}
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

            {/* Selected Card - Mobile optimized */}
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
                    {/* Card Image */}
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

                    {/* Card Details */}
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
    {/* SET SELECTION DROPDOWN - THIS IS THE WHOLE SECTION */}
    <div className="mb-4">
      <label className="block text-xs sm:text-sm font-semibold mb-2">
        {t('selectSet')} ({selectedCard.sets.length} {t('available')})
      </label>
      
      {/* THE SELECT DROPDOWN */}
      <select
        value={selectedSet?.code + '-' + selectedSet?.cardData.collector_number || ''}
        onChange={(e) => {
          const [code, collectorNum] = e.target.value.split('-')
          const set = selectedCard.sets.find(
            s => s.code === code && s.cardData.collector_number === collectorNum
          )
          if (set) {
            handleSetChange(set.code, set.cardData.collector_number)
          }
        }}
        className="input-field w-full text-sm sm:text-base"
        disabled={isLoadingGermanVersion}
      >
        {selectedCard.sets.map((set) => {
          const treatment = getCardTreatment(set.cardData)
          const price = set.marketPrice.toFixed(2)
          const isSpecial = treatment !== 'Regular' && treatment !== 'Normal'
          
          return (
            <option 
              key={`${set.code}-${set.cardData.collector_number}`}
              value={`${set.code}-${set.cardData.collector_number}`}
            >
              {set.name} ({set.code}) #{set.cardData.collector_number} 
              {isSpecial && ` ✨`} {treatment} 
            </option>
          )
        })}
      </select>
      
      {/* HELP TEXT */}
      <p className="text-xs text-gray-400 mt-2">
        💡 {language === 'de' 
          ? 'Verschiedene Versionen können unterschiedliche Preise haben'
          : 'Different treatments may have different prices'
        }
      </p>
    </div>

    {/* PRICE DISPLAY */}
    {selectedSet && !isLoadingGermanVersion && (
      <div className="space-y-3 sm:space-y-4">
        <div className="bg-yellow-accent text-black p-3 sm:p-4 rounded">
  <div className="text-xs sm:text-sm font-semibold">
    {t('estimatedBuyPrice')}
  </div>
  <div className="text-2xl sm:text-3xl font-bold">
    €{calculateBuyPrice(selectedSet.marketPrice).toFixed(2)}  {/* ← NEW */}
  </div>
  <div className="text-xs mt-1 opacity-80">
    {t('pricePerCard')}
  </div>
  
  {/* Add pricing breakdown */}
  <div className="text-xs mt-2 opacity-70">
    {getPricingExplanation(selectedSet.marketPrice, language)}
  </div>
</div>

        {/* Quantity input */}
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

        {/* Add to sell list button */}
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

          {/* Sell List - Stacks on mobile */}
          <div className="lg:col-span-1">
            <SellList />
          </div>
        </div>
      </main>

      {/* REMOVED: Scanner modal */}
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