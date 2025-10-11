'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslations } from '@/lib/i18n'
import { useSellListStore } from '@/context/SellListContext'
import SafeImage from './SafeImage'

interface CardDisplayProps {
  card: any
  tcgName: string
}

export default function CardDisplay({ card, tcgName }: CardDisplayProps) {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const addItem = useSellListStore((state) => state.addItem)
  const [selectedSet, setSelectedSet] = useState(card.sets?.[0] || null)
  const [quantity, setQuantity] = useState(1)

  if (!card) return null

  const handleAddToSellList = () => {
    if (!selectedSet) return

    const buyPrice = selectedSet.marketPrice * 0.7

    addItem({
      id: `${card.id}-${selectedSet.code}-${Date.now()}`,
      cardName: language === 'de' ? card.nameDE : card.name,
      setName: language === 'de' ? selectedSet.nameDE : selectedSet.name,
      setCode: selectedSet.code,
      marketPrice: selectedSet.marketPrice,
      buyPrice: buyPrice,
      quantity: quantity,
      imageUrl: card.imageUrl,
      tcg: tcgName,
    })

    alert(`Added ${quantity}x ${language === 'de' ? card.nameDE : card.name} to sell list!`)
    setQuantity(1)
  }

  return (
    <div className="card">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          {card.imageUrl && (
            <SafeImage
              src={card.imageUrl}
              alt={language === 'de' ? card.nameDE : card.name}
              className="rounded-lg w-full"
              unoptimized
            />
          )}
        </div>

        <div>
          <h2 className="text-2xl font-bold text-yellow-accent mb-4">
            {language === 'de' ? card.nameDE : card.name}
          </h2>

          {card.sets && card.sets.length > 0 && (
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2">
                {t('selectSet')} ({card.sets.length} available)
              </label>
              <select
                value={selectedSet?.code || ''}
                onChange={(e) => {
                  const set = card.sets.find((s: any) => s.code === e.target.value)
                  setSelectedSet(set)
                }}
                className="input-field w-full"
              >
                {card.sets.map((set: any) => (
                  <option key={set.code} value={set.code}>
                    {language === 'de' ? set.nameDE : set.name} ({set.code})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedSet && (
            <div className="space-y-4">
              <div className="bg-yellow-accent text-black p-4 rounded">
                <div className="text-sm font-semibold">{t('estimatedBuyPrice')}</div>
                <div className="text-3xl font-bold">
                  €{(selectedSet.marketPrice * 0.7).toFixed(2)}
                </div>
                <div className="text-xs mt-2 opacity-80">
                  {t('pricePerCard')}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">{t('quantity')}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="input-field w-full"
                />
              </div>

              <button onClick={handleAddToSellList} className="btn-primary w-full">
                {t('addToSellList')}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}