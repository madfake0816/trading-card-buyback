'use client'

import Link from 'next/link'
import { LanguageProvider, useLanguage } from '@/context/LanguageContext'
import { SellListProvider } from '@/context/SellListContext'
import LanguageToggle from '@/components/LanguageToggle'
import { useTranslations } from '@/lib/i18n'
import { FEATURES } from '@/lib/features'

function HomePageContent() {
  const { language } = useLanguage()
  const t = useTranslations(language)

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
    <div className="min-h-screen bg-dark-blue">
      {/* Mobile-optimized header */}
      <header className="bg-dark-blue-light border-b border-yellow-accent">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 md:py-6">
          <div className="flex justify-between items-center gap-2">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 min-w-0">
              {/* Logo */}
              <img 
                src='/SaltyCards-logo.jpg'
                alt="Logo" 
                className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-yellow-accent truncate">
                  Salty Cards Buyback
                </h1>
                <p className="text-xs sm:text-sm md:text-base text-gray-300 mt-1 truncate">
                  {language === 'de' 
                    ? 'Verkaufen Sie Ihre Sammelkarten'
                    : 'Sell your Trading Cards'
                  }
                </p>
              </div>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 md:py-12">
        {/* Hero Section */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-3 sm:mb-4">
            {language === 'de' 
              ? tcgs.length === 1 
                ? `${tcgs[0].name} Ankauf`
                : 'Trading Card Ankauf'
              : tcgs.length === 1
                ? `${tcgs[0].name} Buyback`
                : 'Trading Card Buyback'
            }
          </h2>
          <p className="text-sm sm:text-base text-gray-400">
            {language === 'de'
              ? 'Suchen Sie nach Karten und erstellen Sie sofort Ihre Verkaufsliste'
              : 'Search for cards and build your sell list instantly'
            }
          </p>
        </div>

        {/* TCG Cards Grid - Only shows enabled TCGs */}
        <div className="flex justify-center max-w-6xl mx-auto mb-8 sm:mb-12 md:mb-16">
          {tcgs.length === 0 ? (
            // No TCGs enabled
            <div className="card p-8 text-center max-w-md">
              <p className="text-xl text-yellow-accent mb-4">
                {language === 'de' 
                  ? 'Keine Trading Card Games verfügbar'
                  : 'No Trading Card Games Available'
                }
              </p>
              <p className="text-gray-400 text-sm">
                {language === 'de'
                  ? 'Bitte kontaktieren Sie den Administrator.'
                  : 'Please contact the administrator.'
                }
              </p>
            </div>
          ) : tcgs.length === 1 ? (
            // Single TCG - show as featured card
            <Link
              href={tcgs[0].path}
              className="bg-white border-2 border-yellow-accent rounded-lg p-4 sm:p-6 md:p-8 hover:shadow-2xl transition-all transform hover:scale-105 w-full max-w-md"
            >
              <div className="text-center">
                <div className="mb-3 sm:mb-4 flex justify-center items-center h-24 sm:h-32">
                  <img
                    src={tcgs[0].fallbackLogo}
                    alt={`${tcgs[0].name} logo`}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-dark-blue mb-2">
                  {tcgs[0].name}
                </h3>
                <p className="text-sm sm:text-base text-gray-600">
                  {language === 'de'
                    ? 'Klicken Sie hier, um Ihre Karten zu verkaufen'
                    : 'Click to start selling your cards'
                  }
                </p>
              </div>
            </Link>
          ) : (
            // Multiple TCGs - show as grid
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full">
              {tcgs.map((tcg) => (
                <Link
                  key={tcg.path}
                  href={tcg.path}
                  className="bg-white border-2 border-yellow-accent rounded-lg p-4 sm:p-6 hover:shadow-2xl transition-all transform hover:scale-105"
                >
                  <div className="text-center">
                    <div className="mb-3 sm:mb-4 flex justify-center items-center h-20 sm:h-24">
                      <img
                        src={tcg.fallbackLogo}
                        alt={`${tcg.name} logo`}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <h3 className="text-lg sm:text-xl font-bold text-dark-blue mb-2">
                      {tcg.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-600">
                      {language === 'de'
                        ? 'Karten verkaufen'
                        : 'Sell cards'
                      }
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
            <h3 className="text-xl sm:text-2xl font-bold text-yellow-accent mb-3 sm:mb-4">
              {language === 'de' ? 'So funktioniert es' : 'How It Works'}
            </h3>
            <ol className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-300">
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent font-bold flex-shrink-0">1.</span>
                <span>
                  {language === 'de'
                    ? 'Suchen Sie nach Karten nach Namen auf Englisch oder Deutsch'
                    : 'Search for cards by name in English or German'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent font-bold flex-shrink-0">2.</span>
                <span>
                  {language === 'de'
                    ? 'Wählen Sie das spezifische Set und den Druck Ihrer Karte aus'
                    : 'Select the specific set and printing of your card'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent font-bold flex-shrink-0">3.</span>
                <span>
                  {language === 'de'
                    ? 'Sehen Sie Echtzeit-Marktpreise von der Scryfall API'
                    : 'See real-time market prices from Scryfall API'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent font-bold flex-shrink-0">4.</span>
                <span>
                  {language === 'de'
                    ? 'Fügen Sie Karten zu Ihrer Verkaufsliste hinzu und sehen Sie den Gesamtankaufspreis'
                    : 'Add cards to your sell list and see the total buyback price'
                  }
                </span>
              </li>
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent font-bold flex-shrink-0">5.</span>
                <span>
                  {language === 'de'
                    ? 'Exportieren Sie Ihre Liste als CSV und bringen Sie sie in unseren Shop'
                    : 'Export your list as CSV and bring it to our shop'
                  }
                </span>
              </li>
            </ol>
          </div>

          {/* Features */}
          <div className="card p-4 sm:p-6">
            <h3 className="text-xl sm:text-2xl font-bold text-yellow-accent mb-3 sm:mb-4">
              {language === 'de' ? 'Funktionen' : 'Features'}
            </h3>
            <ul className="space-y-2 text-sm sm:text-base text-gray-300">
              {/* Always show these basic features */}
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent flex-shrink-0">✓</span>
                <span>
                  {language === 'de'
                    ? 'Echtzeit-Preise von der Scryfall API'
                    : 'Real-time pricing from Scryfall API'
                  }
                </span>
              </li>
              
              {FEATURES.enableGermanLanguage && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-yellow-accent flex-shrink-0">✓</span>
                  <span>
                    {language === 'de'
                      ? 'Suche auf Englisch oder Deutsch'
                      : 'Search in English or German'
                    }
                  </span>
                </li>
              )}
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent flex-shrink-0">✓</span>
                <span>
                  {language === 'de'
                    ? 'Alle Sets und Drucke verfügbar'
                    : 'All sets and printings available'
                  }
                </span>
              </li>
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent flex-shrink-0">✓</span>
                <span>
                  {language === 'de'
                    ? 'Unterstützung für doppelseitige Karten'
                    : 'Support for double-faced cards'
                  }
                </span>
              </li>
              
              {FEATURES.enableCSVImport && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-yellow-accent flex-shrink-0">✓</span>
                  <span>
                    {language === 'de'
                      ? 'CSV-Import von Sammlungsverwaltungen'
                      : 'CSV import from collection managers'
                    }
                  </span>
                </li>
              )}
              
              {FEATURES.enableCSVExport && (
                <li className="flex items-start gap-2 sm:gap-3">
                  <span className="text-yellow-accent flex-shrink-0">✓</span>
                  <span>
                    {language === 'de'
                      ? 'CSV-Export Ihrer Verkaufsliste'
                      : 'CSV export of your sell list'
                    }
                  </span>
                </li>
              )}
              
              
              <li className="flex items-start gap-2 sm:gap-3">
                <span className="text-yellow-accent flex-shrink-0">✓</span>
                <span>
                  {language === 'de'
                    ? 'Kein Konto oder Login erforderlich'
                    : 'No account or login required'
                  }
                </span>
              </li>
            </ul>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark-blue-light border-t border-gray-700 mt-8 sm:mt-12 md:mt-16">
        <div className="container mx-auto px-3 sm:px-4 md:px-6 py-4 sm:py-6 text-center text-gray-400">
          <p className="text-sm sm:text-base">
            {language === 'de'
              ? '© 2025 Salty Cards'
              : '© 2025 Salty Cards'
            }
          </p>
          <p className="mt-2 text-xs sm:text-sm">
            {language === 'de'
              ? 'Powered by Scryfall API'
              : 'Powered by Scryfall API'
            }
          </p>
        </div>
      </footer>
    </div>
  )
}

export default function HomePage() {
  return (
    <LanguageProvider>
      <SellListProvider>
        <HomePageContent />
      </SellListProvider>
    </LanguageProvider>
  )
}