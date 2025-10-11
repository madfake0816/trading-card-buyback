'use client'

import { useState, useEffect } from 'react'
import { FEATURES, FEATURE_PRESETS, updateFeatures, applyPreset, FeatureFlags, setCurrentPlan,} from '@/lib/features'

export default function FeatureToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const [features, setFeatures] = useState<FeatureFlags>(FEATURES)
  const [showAdmin, setShowAdmin] = useState(false)

  useEffect(() => {
    // Show admin panel with keyboard shortcut: Ctrl+Shift+F
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'F') {
        setShowAdmin(true)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!showAdmin) return null

  const toggleFeature = (feature: keyof FeatureFlags) => {
    const updated = { ...features, [feature]: !features[feature] }
    setFeatures(updated)
    updateFeatures({ [feature]: !features[feature] })
  }

  const applyPlan = (plan: keyof typeof FEATURE_PRESETS) => {
    applyPreset(plan)
  }
  const handlePlanChange = (plan: string) => {
  setCurrentPlan(plan)
  
  
  // Trigger custom event
  window.dispatchEvent(new Event('featuresUpdated'))
  
  // Reload page to apply changes everywhere
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-purple-600 text-white p-3 rounded-full shadow-lg hover:bg-purple-700 transition-colors"
        title="Feature Configuration (Ctrl+Shift+F)"
      >
        ⚙️
      </button>

      {/* Feature Panel */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border-2 border-purple-500 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-purple-400">
                  🔧 Feature Configuration
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-white text-3xl"
                >
                  ×
                </button>
              </div>

              {/* Warning */}
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 p-4 rounded-lg mb-6">
                <p className="text-yellow-300 text-sm">
                  ⚠️ <strong>Admin Tool:</strong> This panel is for development and configuration only. 
                  Changes are saved to localStorage and will affect the current browser session.
                </p>
              </div>

              {/* Quick Presets */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-3">Quick Apply Plan:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.keys(FEATURE_PRESETS).map((plan) => (
                    <button
                      key={plan}
                      onClick={() => applyPlan(plan as keyof typeof FEATURE_PRESETS)}
                      className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded font-semibold transition-colors"
                    >
                      {plan}
                    </button>
                  ))}
                </div>
              </div>

              {/* TCG Features */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Trading Card Games:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'enableMTG', label: 'Magic: The Gathering' },
                    { key: 'enablePokemon', label: 'Pokémon' },
                    { key: 'enableYugioh', label: 'Yu-Gi-Oh!' },
                    { key: 'enableOnepiece', label: 'One Piece' },
                    { key: 'enableLorcana', label: 'Lorcana' },
                    { key: 'enableFAB', label: 'Flesh and Blood' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={features[key as keyof FeatureFlags] as boolean}
                        onChange={() => toggleFeature(key as keyof FeatureFlags)}
                        className="w-5 h-5"
                      />
                      <span className="text-white">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Core Features */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-purple-400 mb-3">Core Features:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'enableCardScanner', label: '📷 Card Scanner', premium: false },
                    { key: 'enableCSVImport', label: '📥 CSV Import', premium: false },
                    { key: 'enableCSVExport', label: '📤 CSV Export', premium: false },
                    { key: 'enableBulkScan', label: '⚡ Bulk Scan Mode', premium: true },
                    { key: 'enableGermanLanguage', label: '🇩🇪 German Language', premium: false },
                    { key: 'enableCheckout', label: '🛒 Checkout System', premium: false },
                  ].map(({ key, label, premium }) => (
                    <label key={key} className="flex items-center gap-3 bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700">
                      <input
                        type="checkbox"
                        checked={features[key as keyof FeatureFlags] as boolean}
                        onChange={() => toggleFeature(key as keyof FeatureFlags)}
                        className="w-5 h-5"
                      />
                      <span className="text-white flex-1">{label}</span>
                      {premium && (
                        <span className="text-xs bg-yellow-600 text-black px-2 py-1 rounded font-bold">
                          PREMIUM
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>

              {/* Advanced Features */}
              <div>
                <h3 className="text-lg font-bold text-purple-400 mb-3">Advanced Features (Future):</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'enablePriceHistory', label: '📊 Price History' },
                    { key: 'enableCollectionManager', label: '📚 Collection Manager' },
                    { key: 'enableDeckBuilder', label: '🎴 Deck Builder' },
                    { key: 'enablePriceAlerts', label: '🔔 Price Alerts' },
                    { key: 'enableMultipleLanguages', label: '🌍 Multiple Languages' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-3 bg-gray-800 p-3 rounded cursor-pointer hover:bg-gray-700 opacity-60">
                      <input
                        type="checkbox"
                        checked={features[key as keyof FeatureFlags] as boolean}
                        onChange={() => toggleFeature(key as keyof FeatureFlags)}
                        className="w-5 h-5"
                      />
                      <span className="text-white flex-1">{label}</span>
                      <span className="text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                        COMING SOON
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Current Configuration */}
              <div className="mt-6 bg-gray-800 p-4 rounded">
                <h4 className="text-sm font-bold text-gray-400 mb-2">Current Configuration:</h4>
                <pre className="text-xs text-green-400 overflow-x-auto">
                  {JSON.stringify(features, null, 2)}
                </pre>
              </div>

              {/* Close Button */}
              <div className="mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded font-semibold"
                >
                  Close Configuration Panel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}