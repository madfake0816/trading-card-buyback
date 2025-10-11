'use client'

import { useState } from 'react'
import { useLanguage } from '@/context/LanguageContext'
import { useTranslations } from '@/lib/i18n'
import { useSellListStore } from '@/context/SellListContext'
import { isFeatureEnabled } from '@/lib/features'
import Checkout from './Checkout'
import Papa from 'papaparse'


export default function SellList() {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const { items, removeItem, updateQuantity, clearList, getTotalBuyPrice } = useSellListStore()
  const [showCheckout, setShowCheckout] = useState(false)

  // Check feature flags
  const canExport = isFeatureEnabled('enableCSVExport')
  const hasCheckout = isFeatureEnabled('enableCheckout')

  const exportToCSV = () => {
    if (!canExport) {
      alert(language === 'de'
        ? 'CSV-Export ist in Ihrem aktuellen Plan nicht verfügbar.'
        : 'CSV export is not available in your current plan.'
      )
      return
    }

    const csvData = items.map(item => ({
      'Card Name': item.cardName,
      'Set': item.setName,
      'Set Code': item.setCode,
      'Quantity': item.quantity,
      'Estimated Buy Price (Each)': item.buyPrice.toFixed(2),
      'Total Estimated Price': (item.buyPrice * item.quantity).toFixed(2),
      'TCG': item.tcg,
    }))

    const csv = Papa.unparse(csvData)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    
    link.setAttribute('href', url)
    link.setAttribute('download', `sell-list-${Date.now()}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (items.length === 0) {
    return (
      <div className="card p-4 sm:p-6 text-center text-gray-400 text-sm sm:text-base">
        <p>{t('noCards')}</p>
      </div>
    )
  }

  return (
    <>
      <div className="card p-3 sm:p-4 md:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h2 className="text-xl sm:text-2xl font-bold text-yellow-accent">
            {t('sellList')}
          </h2>
          <div className="flex gap-2 w-full sm:w-auto">
            {canExport && (
              <button onClick={exportToCSV} className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial">
                {t('exportCSV')}
              </button>
            )}
            <button onClick={clearList} className="btn-secondary text-xs sm:text-sm flex-1 sm:flex-initial">
              {t('clearList')}
            </button>
          </div>
        </div>

        {/* Quality Notice */}
        <div className="bg-yellow-accent bg-opacity-20 border border-yellow-accent p-2 sm:p-3 rounded mb-3 sm:mb-4">
          <p className="text-xs text-yellow-accent">
            ⚠️ {language === 'de'
              ? 'Preise für NM-Zustand. Unverbindliches Angebot.'
              : 'Prices for NM condition. Non-binding offer.'
            }
          </p>
        </div>

        {/* Mobile: Card list view */}
        <div className="block md:hidden space-y-3">
          {items.map((item) => (
            <div key={item.id} className="bg-dark-blue p-3 rounded-lg border border-gray-700">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm truncate">{item.cardName}</h3>
                  <p className="text-xs text-gray-400 truncate">{item.setName}</p>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
                  className="text-red-500 hover:text-red-400 text-xs ml-2 flex-shrink-0"
                >
                  {t('remove')}
                </button>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-gray-400">{t('quantity')}:</label>
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                    className="w-16 bg-dark-blue-light border border-gray-600 rounded px-2 py-1 text-sm text-center"
                  />
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400">
                    €{item.buyPrice.toFixed(2)} × {item.quantity}
                  </div>
                  <div className="text-sm font-bold text-yellow-accent">
                    €{(item.buyPrice * item.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table view */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-600">
                <th className="text-left py-2 text-yellow-accent">{t('cardName')}</th>
                <th className="text-left py-2 text-yellow-accent">{t('setName')}</th>
                <th className="text-center py-2 text-yellow-accent">{t('quantity')}</th>
                <th className="text-right py-2 text-yellow-accent">{t('estimatedPrice')}</th>
                <th className="text-right py-2 text-yellow-accent">{t('total')}</th>
                <th className="text-center py-2 text-yellow-accent"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-gray-700">
                  <td className="py-3">{item.cardName}</td>
                  <td className="py-3 text-gray-400 text-sm">{item.setName}</td>
                  <td className="py-3 text-center">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                      className="w-16 bg-dark-blue border border-gray-600 rounded px-2 py-1 text-center"
                    />
                  </td>
                  <td className="py-3 text-right">€{item.buyPrice.toFixed(2)}</td>
                  <td className="py-3 text-right font-bold text-yellow-accent">
                    €{(item.buyPrice * item.quantity).toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-400 font-semibold text-sm"
                    >
                      {t('remove')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-yellow-accent">
                <td colSpan={4} className="py-3 text-right font-bold text-base lg:text-lg">
                  {t('estimatedTotal')}:
                </td>
                <td className="py-3 text-right font-bold text-xl lg:text-2xl text-yellow-accent">
                  €{getTotalBuyPrice().toFixed(2)}
                </td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Mobile: Total */}
        <div className="block md:hidden mt-4 pt-4 border-t-2 border-yellow-accent">
          <div className="flex justify-between items-center">
            <span className="font-bold text-base">{t('estimatedTotal')}:</span>
            <span className="font-bold text-2xl text-yellow-accent">
              €{getTotalBuyPrice().toFixed(2)}
            </span>
          </div>
        </div>

        {/* Checkout Button - Only show if feature enabled */}
        {hasCheckout && (
          <div className="mt-4 sm:mt-6">
            <button
              onClick={() => setShowCheckout(true)}
              className="btn-primary w-full text-base sm:text-lg py-3"
            >
              {language === 'de' ? '🛒 Zum Checkout' : '🛒 Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>

      

      {hasCheckout && showCheckout && <Checkout onClose={() => setShowCheckout(false)} />}
    </>
  )
}