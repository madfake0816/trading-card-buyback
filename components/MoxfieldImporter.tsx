'use client'

import { useState } from 'react'
import { useSellListStore } from '@/context/SellListContext'
import { getMTGCardByName } from '@/lib/api/scryfall'
import { useLanguage } from '@/context/LanguageContext'

interface MoxfieldCard {
  quantity: number
  cardName: string
  setCode?: string
  collectorNumber?: string
}

export default function MoxfieldImporter() {
  const [isOpen, setIsOpen] = useState(false)
  const [pastedText, setPastedText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: 0 })
  const [results, setResults] = useState<{ success: number; failed: string[] }>({ 
    success: 0, 
    failed: [] 
  })
  
  const addItem = useSellListStore((state) => state.addItem)
  const { language } = useLanguage()

  const parseMoxfieldList = (text: string): MoxfieldCard[] => {
    const lines = text.trim().split('\n')
    const cards: MoxfieldCard[] = []

    for (const line of lines) {
      // Skip empty lines and comments
      if (!line.trim() || line.trim().startsWith('//')) continue

      // Moxfield format examples:
      // 1x Lightning Bolt (LEA) 123
      // 4x Black Lotus
      // 2 Sol Ring (C21) 234
      
      const match = line.match(/^(\d+)x?\s+([^(]+?)(?:\s+\(([A-Z0-9]+)\))?(?:\s+(\d+[a-z]*))?$/i)
      
      if (match) {
        const [, qty, name, setCode, collectorNum] = match
        cards.push({
          quantity: parseInt(qty),
          cardName: name.trim(),
          setCode: setCode?.trim().toUpperCase(),
          collectorNumber: collectorNum?.trim()
        })
      }
    }

    return cards
  }

  const handleImport = async () => {
    if (!pastedText.trim()) return

    setIsProcessing(true)
    setResults({ success: 0, failed: [] })

    const cards = parseMoxfieldList(pastedText)
    setProgress({ current: 0, total: cards.length })

    let successCount = 0
    const failedCards: string[] = []

    for (let i = 0; i < cards.length; i++) {
      const card = cards[i]
      setProgress({ current: i + 1, total: cards.length })

      try {
        // Fetch card from Scryfall
        const scryfallCard = await getMTGCardByName(card.cardName)

        if (scryfallCard) {
          // Calculate price
          const eurPrice = scryfallCard.prices?.eur
          const usdPrice = scryfallCard.prices?.usd
          
          let price = 0
          if (eurPrice && eurPrice !== 'null') {
            price = parseFloat(eurPrice)
          } else if (usdPrice && usdPrice !== 'null') {
            price = parseFloat(usdPrice) * 0.92
          }

          const marketPrice = price > 0 ? price : 0.50
          const buyPrice = marketPrice * 0.7

          // Get image URL
          let imageUrl = ''
          if (scryfallCard.image_uris?.normal) {
            imageUrl = scryfallCard.image_uris.normal
          } else if (scryfallCard.card_faces?.[0]?.image_uris?.normal) {
            imageUrl = scryfallCard.card_faces[0].image_uris.normal
          }

          // Add to sell list
          addItem({
            id: `${card.cardName}-${scryfallCard.set}-${Date.now()}-${i}`,
            cardName: card.cardName,
            setName: scryfallCard.set_name,
            setCode: scryfallCard.set.toUpperCase(),
            marketPrice: marketPrice,
            buyPrice: buyPrice,
            quantity: card.quantity,
            imageUrl: imageUrl,
            tcg: 'Magic: The Gathering',
          })

          successCount++
        } else {
          failedCards.push(card.cardName)
        }
      } catch (error) {
        console.error('Error fetching card:', card.cardName, error)
        failedCards.push(card.cardName)
      }

      // Rate limiting: wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    setResults({ success: successCount, failed: failedCards })
    setIsProcessing(false)
  }

  const handleClear = () => {
    setPastedText('')
    setResults({ success: 0, failed: [] })
    setProgress({ current: 0, total: 0 })
  }

  const handleClose = () => {
    setIsOpen(false)
    // Clear after closing
    setTimeout(() => {
      handleClear()
    }, 300)
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors text-sm font-semibold"
      >
        📋 {language === 'de' ? 'Von Moxfield importieren' : 'Import from Moxfield'}
      </button>

      {/* Modal Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleClose}
        >
          <div 
            className="bg-dark-blue-light rounded-lg border-2 border-yellow-accent max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-yellow-accent">
                  📋 {language === 'de' ? 'Moxfield Liste importieren' : 'Import from Moxfield'}
                </h2>
                <button
                  onClick={handleClose}
                  className="text-gray-400 hover:text-white text-3xl leading-none"
                  disabled={isProcessing}
                >
                  ×
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Instructions */}
              <div className="mb-6 p-4 bg-gray-800 rounded-lg">
                <p className="font-semibold mb-3 text-yellow-accent">
                  📖 {language === 'de' ? 'Anleitung:' : 'Instructions:'}
                </p>
                <ol className="list-decimal list-inside space-y-2 text-gray-300">
                  <li>
                    {language === 'de' 
                      ? 'Öffnen Sie Ihr Moxfield Deck'
                      : 'Open your Moxfield deck'}
                  </li>
                  <li>
                    {language === 'de'
                      ? 'Klicken Sie auf "Export" → "Text"'
                      : 'Click "Export" → "Text"'}
                  </li>
                  <li>
                    {language === 'de'
                      ? 'Kopieren Sie die Liste und fügen Sie sie unten ein'
                      : 'Copy the list and paste it below'}
                  </li>
                </ol>
                <div className="mt-4 p-3 bg-gray-900 rounded font-mono text-xs">
                  <div className="text-gray-500 mb-2">
                    // {language === 'de' ? 'Beispiel:' : 'Example:'}
                  </div>
                  <div className="text-green-400">4x Lightning Bolt</div>
                  <div className="text-green-400">1x Black Lotus (LEA) 4</div>
                  <div className="text-green-400">2 Sol Ring (C21) 234</div>
                </div>
              </div>

              {/* Textarea */}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-2 text-gray-300">
                  {language === 'de' ? 'Kartenliste einfügen:' : 'Paste card list:'}
                </label>
                <textarea
                  value={pastedText}
                  onChange={(e) => setPastedText(e.target.value)}
                  placeholder={language === 'de' 
                    ? 'Fügen Sie Ihre Moxfield Liste hier ein...\n\n4x Lightning Bolt\n1x Black Lotus\n2 Sol Ring'
                    : 'Paste your Moxfield list here...\n\n4x Lightning Bolt\n1x Black Lotus\n2 Sol Ring'}
                  className="w-full h-64 p-4 bg-gray-800 border-2 border-gray-700 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-yellow-accent transition-colors"
                  disabled={isProcessing}
                />
                <p className="text-xs text-gray-500 mt-2">
                  {language === 'de' 
                    ? '💡 Tipp: Sie können mehrere Karten auf einmal einfügen'
                    : '💡 Tip: You can paste multiple cards at once'}
                </p>
              </div>

              {/* Progress */}
              {isProcessing && (
                <div className="mb-4 p-4 bg-blue-900 bg-opacity-30 border border-blue-500 rounded-lg">
                  <div className="flex justify-between text-sm text-gray-300 mb-2">
                    <span className="font-semibold">
                      ⏳ {language === 'de' ? 'Verarbeite Karten...' : 'Processing cards...'}
                    </span>
                    <span className="font-mono">
                      {progress.current} / {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-yellow-accent to-yellow-500 h-3 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Results */}
              {results.success > 0 && !isProcessing && (
                <div className="mb-4 space-y-3">
                  {/* Success Message */}
                  <div className="p-4 bg-green-900 bg-opacity-30 border border-green-500 rounded-lg">
                    <p className="text-green-400 font-semibold flex items-center gap-2">
                      <span className="text-xl">✅</span>
                      <span>
                        {results.success} {language === 'de' ? 'Karten erfolgreich hinzugefügt!' : 'cards added successfully!'}
                      </span>
                    </p>
                  </div>

                  {/* Failed Cards */}
                  {results.failed.length > 0 && (
                    <div className="p-4 bg-red-900 bg-opacity-30 border border-red-500 rounded-lg">
                      <p className="text-red-400 font-semibold mb-2 flex items-center gap-2">
                        <span className="text-xl">⚠️</span>
                        <span>
                          {results.failed.length} {language === 'de' ? 'Karten nicht gefunden:' : 'cards not found:'}
                        </span>
                      </p>
                      <ul className="text-sm text-gray-300 mt-2 max-h-32 overflow-y-auto space-y-1">
                        {results.failed.map((name, i) => (
                          <li key={i} className="font-mono">• {name}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-700 bg-gray-800 bg-opacity-50">
              <div className="flex gap-3">
                <button
                  onClick={handleImport}
                  disabled={!pastedText.trim() || isProcessing}
                  className="flex-1 px-6 py-3 bg-yellow-accent hover:bg-yellow-500 text-black font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing 
                    ? (language === 'de' ? '⏳ Verarbeite...' : '⏳ Processing...')
                    : (language === 'de' ? '📥 Importieren' : '📥 Import')}
                </button>
                <button
                  onClick={handleClear}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'de' ? '🗑️ Löschen' : '🗑️ Clear'}
                </button>
                <button
                  onClick={handleClose}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {language === 'de' ? '✕ Schließen' : '✕ Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}