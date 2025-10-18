'use client'

import Link from 'next/link'
import { useLanguage } from '@/context/LanguageContext'
import TranslatedText from '@/components/TranslatedText'
import { FEATURES } from '@/lib/features'
import FeaturedBuylist from '@/components/FeaturedBuylist'

export default function HomePage() {
  const { language } = useLanguage()

  // All possible TCGs with their feature flags
  const allTcgs = [
    { 
      name: 'Magic: The Gathering', 
      path: '/mtg', 
      fallbackLogo: '/mtg-logo.png',
      enabled: FEATURES.enableMTG
    },
    { 
      name: 'Pokémon', 
      path: '/pokemon', 
      fallbackLogo: '/pokemon-logo.png',
      enabled: FEATURES.enablePokemon
    },
    { 
      name: 'Yu-Gi-Oh!', 
      path: '/yugioh', 
      fallbackLogo: '/yugioh-logo.png',
      enabled: FEATURES.enableYugioh
    },
    { 
      name: 'One Piece', 
      path: '/onepiece', 
      fallbackLogo: '/onepiece-logo.png',
      enabled: FEATURES.enableOnepiece
    },
    { 
      name: 'Lorcana', 
      path: '/lorcana', 
      fallbackLogo: '/lorcana-logo.png',
      enabled: FEATURES.enableLorcana
    },
    { 
      name: 'Flesh and Blood', 
      path: '/fab', 
      fallbackLogo: '/fab-logo.png',
      enabled: FEATURES.enableFleshAndBlood
    },
  ]

  // Filter to only show enabled TCGs
  const tcgs = allTcgs.filter(tcg => tcg.enabled)

  return (
    <div className="min-h-screen bg-slate-900">
      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            <TranslatedText
              en={tcgs.length === 1 ? `${tcgs[0].name} Buyback` : 'Trading Card Buyback'}
              de={tcgs.length === 1 ? `${tcgs[0].name} Ankauf` : 'Trading Card Ankauf'}
            />
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            <TranslatedText
              en="Search for cards and build your sell list instantly"
              de="Suchen Sie nach Karten und erstellen Sie sofort Ihre Verkaufsliste"
            />
          </p>
        </div>

        {/* TCG Cards Grid */}
        <div className="flex justify-center max-w-6xl mx-auto mb-8 sm:mb-12 md:mb-16">
          {tcgs.length === 0 ? (
            <div className="card p-8 text-center max-w-md">
              <p className="text-xl text-cyan-500 mb-4">
                <TranslatedText
                  en="No Trading Card Games Available"
                  de="Keine Trading Card Games verfügbar"
                />
              </p>
              <p className="text-gray-400 text-sm">
                <TranslatedText
                  en="Please contact the administrator."
                  de="Bitte kontaktieren Sie den Administrator."
                />
              </p>
            </div>
          ) : tcgs.length === 1 ? (
            <Link
              href={tcgs[0].path}
              className="bg-white border-2 border-cyan-500 rounded-lg p-4 sm:p-6 md:p-8 hover:shadow-2xl transition-all transform hover:scale-105 w-full max-w-md"
            >
              <div className="text-center">
                <div className="mb-3 sm:mb-4 flex justify-center items-center h-24 sm:h-32">
                  <img
                    src={tcgs[0].fallbackLogo}
                    alt={`${tcgs[0].name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
                  {tcgs[0].name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  <TranslatedText
                    en="Click to start selling your cards"
                    de="Klicken Sie hier, um Ihre Karten zu verkaufen"
                  />
                </p>
              </div>
            </Link>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {tcgs.map((tcg) => (
                <Link
                  key={tcg.path}
                  href={tcg.path}
                  className="bg-white border-2 border-cyan-500 rounded-lg p-4 sm:p-6 hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className="mb-3 sm:mb-4 flex justify-center items-center h-20 sm:h-24">
                      <img
                        src={tcg.fallbackLogo}
                        alt={`${tcg.name} logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                      {tcg.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      <TranslatedText
                        en="Sell cards"
                        de="Karten verkaufen"
                      />
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Info Cards */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* How It Works */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-cyan-500 mb-3 sm:mb-4">
              <TranslatedText en="How It Works" de="So funktioniert es" />
            </h3>
            <ol className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-300">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 font-bold flex-shrink-0">1.</span>
                <TranslatedText
                  en="Search for cards by name in English or German"
                  de="Suchen Sie nach Karten nach Namen auf Englisch oder Deutsch"
                />
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 font-bold flex-shrink-0">2.</span>
                <TranslatedText
                  en="Select the specific set and printing of your card"
                  de="Wählen Sie das spezifische Set und den Druck Ihrer Karte aus"
                />
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 font-bold flex-shrink-0">3.</span>
                <TranslatedText
                  en="See real-time market prices from Scryfall API"
                  de="Sehen Sie Echtzeit-Marktpreise von der Scryfall API"
                />
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 font-bold flex-shrink-0">4.</span>
                <TranslatedText
                  en="Add cards to your sell list and see the total buyback price"
                  de="Fügen Sie Karten zu Ihrer Verkaufsliste hinzu und sehen Sie den Gesamtankaufspreis"
                />
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 font-bold flex-shrink-0">5.</span>
                <TranslatedText
                  en="Submit your list and get paid quickly"
                  de="Senden Sie Ihre Liste und erhalten Sie schnell Ihre Zahlung"
                />
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-cyan-500 mb-3 sm:mb-4">
              <TranslatedText en="Features" de="Funktionen" />
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-300">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 flex-shrink-0">✓</span>
                <TranslatedText
                  en="Real-time pricing from Scryfall API"
                  de="Echtzeit-Preise von der Scryfall API"
                />
              </li>
              
              {FEATURES.enableGermanLanguage && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-cyan-500 flex-shrink-0">✓</span>
                  <TranslatedText
                    en="Search in English or German"
                    de="Suche auf Englisch oder Deutsch"
                  />
                </li>
              )}
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 flex-shrink-0">✓</span>
                <TranslatedText
                  en="All sets and printings available"
                  de="Alle Sets und Drucke verfügbar"
                />
              </li>
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 flex-shrink-0">✓</span>
                <TranslatedText
                  en="Support for double-faced cards"
                  de="Unterstützung für doppelseitige Karten"
                />
              </li>
              
              {FEATURES.enableCSVImport && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-cyan-500 flex-shrink-0">✓</span>
                  <TranslatedText
                    en="CSV import from collection managers"
                    de="CSV-Import von Sammlungsverwaltungen"
                  />
                </li>
              )}
              
              {FEATURES.enableCSVExport && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-cyan-500 flex-shrink-0">✓</span>
                  <TranslatedText
                    en="CSV export of your sell list"
                    de="CSV-Export Ihrer Verkaufsliste"
                  />
                </li>
              )}
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-cyan-500 flex-shrink-0">✓</span>
                <TranslatedText
                  en="Fast payment and fair prices"
                  de="Schnelle Zahlung und faire Preise"
                />
              </li>
            </ul>
          </div>
        </div>
        {/* Info Cards */}
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* ... existing How It Works and Features sections ... */}
        </div>

        {/* Featured Buylist - NEW */}
        <FeaturedBuylist />

      </main>
      

      {/* Footer */}
      <footer className="bg-slate-800 border-t border-slate-700 mt-8 sm:mt-12 md:mt-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-gray-400">
          <p className="text-sm sm:text-base">© 2025 CardFlow</p>
          <p className="mt-2 text-xs sm:text-sm">
            <TranslatedText
              en="Powered by Scryfall API"
              de="Powered by Scryfall API"
            />
          </p>
        </div>
      </footer>
    </div>
  )
}