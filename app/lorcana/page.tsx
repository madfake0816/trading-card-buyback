'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { SellListProvider } from '@/context/SellListContext'
import LanguageToggle from '@/components/LanguageToggle'
import CardSearch from '@/components/CardSearch'
import CardDisplay from '@/components/CardDisplay'
import SellList from '@/components/SellList'
import CSVImporter from '@/components/CSVImporter'
import SafeImage from '@/components/SafeImage'
import { useTranslations } from '@/lib/i18n'
import { lorcanaMockData } from '@/lib/mockData/lorcana'

function LorcanaPageContent() {
  const { language } = useLanguage()
  const t = useTranslations(language)
  const [selectedCard, setSelectedCard] = useState<any>(null)

  const handleCardSelect = (card: any) => {
    setSelectedCard(card)
  }

  return (
    <div className="min-h-screen bg-dark-blue">
      <header className="bg-dark-blue-light border-b border-yellow-accent">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Link href="/" className="text-yellow-accent hover:text-yellow-dark">
                ← {t('backToHome')}
              </Link>
              <h1 className="text-4xl font-bold text-yellow-accent mt-2">Disney Lorcana</h1>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="card">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-yellow-accent">{t('search')}</h2>
                <CSVImporter tcgName="Lorcana" cards={lorcanaMockData} />
              </div>
              <CardSearch
                cards={lorcanaMockData}
                onSelectCard={handleCardSelect}
                tcgName="Lorcana"
              />
            </div>

            {selectedCard && (
              <>
                <button
                  onClick={() => setSelectedCard(null)}
                  className="btn-secondary"
                >
                  ← Back to Search
                </button>
                <CardDisplay card={selectedCard} tcgName="Lorcana" />
              </>
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

export default function LorcanaPage() {
  return (
    <LanguageProvider>
      <SellListProvider>
        <LorcanaPageContent />
      </SellListProvider>
    </LanguageProvider>
  )
}