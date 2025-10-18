'use client'

import { useSellListStore } from '@/context/SellListContext'
import { useLanguage } from '@/context/LanguageContext'
import SafeImage from './SafeImage'
import SubmitToBackend from './SubmitToBackend'

export default function SellList() {
  const { language } = useLanguage()
  const items = useSellListStore((state) => state.items)
  const removeItem = useSellListStore((state) => state.removeItem)
  const updateQuantity = useSellListStore((state) => state.updateQuantity)
  const clearList = useSellListStore((state) => state.clearList)

  const t = (key: string) => {
    const translations: Record<string, Record<string, string>> = {
      title: { en: 'Your Sell List', de: 'Deine Verkaufsliste' },
      empty: { en: 'No cards added yet', de: 'Noch keine Karten hinzugefügt' },
      emptyHint: { en: 'Search and add cards to start', de: 'Suche und füge Karten hinzu' },
      total: { en: 'Total', de: 'Gesamt' },
      clear: { en: 'Clear All', de: 'Alle löschen' },
      remove: { en: 'Remove', de: 'Entfernen' },
      quantity: { en: 'Qty', de: 'Anz.' },
    }
    return translations[key]?.[language] || key
  }

  const totalBuyPrice = items.reduce(
    (sum, item) => sum + item.buyPrice * item.quantity,
    0
  )

  if (items.length === 0) {
    return (
      <div className="card p-6 sticky top-4">
        <h2 className="text-xl font-bold text-cyan-500 mb-4">{t('title')}</h2>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-gray-400 mb-2">{t('empty')}</p>
          <p className="text-sm text-gray-500">{t('emptyHint')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="card p-4 sm:p-6 sticky top-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-cyan-500">{t('title')}</h2>
        <button
          onClick={clearList}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          {t('clear')}
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3 mb-4 max-h-[50vh] overflow-y-auto">
        {items.map((item) => (
          <div
            key={`${item.setCode}-${item.cardName}-${item.collectorNumber}`}
            className="bg-slate-800 p-3 rounded-lg"
          >
            <div className="flex gap-3">
              {/* Card Image */}
              {item.imageUrl && (
                <div className="flex-shrink-0">
                  <SafeImage
                    src={item.imageUrl}
                    alt={item.cardName}
                    className="rounded"
                    style={{ width: '60px', height: 'auto' }}
                    unoptimized
                  />
                </div>
              )}

              {/* Card Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1 truncate">
                  {item.cardName}
                </div>
                <div className="text-xs text-black mb-2">
                  {item.setName} ({item.setCode.toUpperCase()})
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs text-gray-400">{t('quantity')}:</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQuantity(
                        item.setCode,
                        item.cardName,
                        item.collectorNumber,
                        Math.max(1, item.quantity - 1)
                      )}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-bold text-white bg-slate-900 rounded px-2 py-1 text-sm">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(
                        item.setCode,
                        item.cardName,
                        item.collectorNumber,
                        item.quantity + 1
                      )}
                      className="w-6 h-6 bg-slate-700 hover:bg-slate-600 rounded flex items-center justify-center text-sm font-bold transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-emerald-400">
                    €{(item.buyPrice * item.quantity).toFixed(2)}
                  </span>
                  <button
                    onClick={() => removeItem(item.setCode, item.cardName, item.collectorNumber)}
                    className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  >
                    {t('remove')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="pt-4 border-t border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <span className="font-bold text-lg">{t('total')}:</span>
          <span className="text-2xl font-bold text-emerald-400">
            €{totalBuyPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Submission Component (replaces old checkout) */}
      <SubmitToBackend />
    </div>
  )
}