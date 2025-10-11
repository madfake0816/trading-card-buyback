export interface FeatureFlags {
  enableMTG: boolean
  enablePokemon: boolean
  enableYugioh: boolean
  enableOnepiece: boolean
  enableLorcana: boolean
  enableFleshAndBlood: boolean
  enableCSVImport: boolean
  enableCSVExport: boolean
  enableGermanLanguage: boolean
  enableCheckout: boolean
}

export const PLAN_FEATURES: Record<string, FeatureFlags> = {
  FREE: {
    enableMTG: true,
    enablePokemon: false,
    enableYugioh: false,
    enableOnepiece: false,
    enableLorcana: false,
    enableFleshAndBlood: false,
    enableCSVImport: false,
    enableCSVExport: true,
    enableGermanLanguage: true,
    enableCheckout: true,
  },
  BASIC: {
    enableMTG: true,
    enablePokemon: false,
    enableYugioh: false,
    enableOnepiece: false,
    enableLorcana: false,
    enableFleshAndBlood: false,
    enableCSVImport: true,
    enableCSVExport: true,
    enableGermanLanguage: true,
    enableCheckout: true,
  },
  STANDARD: {
    enableMTG: true,
    enablePokemon: true,
    enableYugioh: true,
    enableOnepiece: true,
    enableLorcana: false,
    enableFleshAndBlood: false,
    enableCSVImport: true,
    enableCSVExport: true,
    enableGermanLanguage: true,
    enableCheckout: true,
  },
  PREMIUM: {
    enableMTG: true,
    enablePokemon: true,
    enableYugioh: true,
    enableOnepiece: true,
    enableLorcana: true,
    enableFleshAndBlood: true,
    enableCSVImport: true,
    enableCSVExport: true,
    enableGermanLanguage: true,
    enableCheckout: true,
  },
}

// Export FEATURE_PRESETS (alias for PLAN_FEATURES)
export const FEATURE_PRESETS = PLAN_FEATURES

// Default features based on environment variables
const DEFAULT_FEATURES: FeatureFlags = {
  enableMTG: process.env.NEXT_PUBLIC_FEATURE_MTG !== 'false',
  enablePokemon: process.env.NEXT_PUBLIC_FEATURE_POKEMON === 'true',
  enableYugioh: process.env.NEXT_PUBLIC_FEATURE_YUGIOH === 'true',
  enableOnepiece: process.env.NEXT_PUBLIC_FEATURE_ONEPIECE === 'true',
  enableLorcana: process.env.NEXT_PUBLIC_FEATURE_LORCANA === 'true',
  enableFleshAndBlood: process.env.NEXT_PUBLIC_FEATURE_FLESH_AND_BLOOD === 'true',
  enableCSVImport: process.env.NEXT_PUBLIC_FEATURE_CSV_IMPORT === 'true',
  enableCSVExport: process.env.NEXT_PUBLIC_FEATURE_CSV_EXPORT !== 'false',
  enableGermanLanguage: process.env.NEXT_PUBLIC_FEATURE_GERMAN !== 'false',
  enableCheckout: process.env.NEXT_PUBLIC_FEATURE_CHECKOUT !== 'false',
}

// Get current plan from environment or default to PREMIUM
function getCurrentPlan(): string {
  if (typeof window === 'undefined') {
    return process.env.NEXT_PUBLIC_PLAN || 'PREMIUM'
  }
  return localStorage.getItem('currentPlan') || process.env.NEXT_PUBLIC_PLAN || 'PREMIUM'
}

// Get features for current plan
function getFeatures(): FeatureFlags {
  const plan = getCurrentPlan()
  return PLAN_FEATURES[plan] || DEFAULT_FEATURES
}

// Export FEATURES object
export const FEATURES = getFeatures()

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  if (typeof window === 'undefined') {
    return DEFAULT_FEATURES[feature]
  }
  
  const plan = getCurrentPlan()
  const planFeatures = PLAN_FEATURES[plan] || DEFAULT_FEATURES
  return planFeatures[feature]
}

// ADD THESE MISSING FUNCTIONS:

// Function to update features (for feature toggle component)
export function setCurrentPlan(plan: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentPlan', plan)
    
    // Trigger storage event
    window.dispatchEvent(new Event('storage'))
    
    // Also dispatch custom event for better reliability
    window.dispatchEvent(new Event('featuresUpdated'))
  }
}

// Apply a preset (plan)
export function applyPreset(presetName: string): void {
  setCurrentPlan(presetName)
  if (typeof window !== 'undefined') {
    window.location.reload() // Reload to apply changes
  }
}

// Update individual features
export function updateFeatures(updates: Partial<FeatureFlags>): void {
  if (typeof window === 'undefined') return
  
  const currentPlan = getCurrentPlan()
  const currentFeatures = PLAN_FEATURES[currentPlan] || DEFAULT_FEATURES
  
  const updatedFeatures = { ...currentFeatures, ...updates }
  
  // Store updated features in localStorage
  localStorage.setItem('customFeatures', JSON.stringify(updatedFeatures))
  
  // Trigger update
  window.dispatchEvent(new Event('storage'))
}

// Get all available plans
export function getAvailablePlans(): string[] {
  return Object.keys(PLAN_FEATURES)
}

// Get current plan name
export function getCurrentPlanName(): string {
  return getCurrentPlan()
}
