/**
 * Calculate buy price based on market price
 * 
 * Rules:
 * - €3.00+: 50% of market price
 * - €0.50 - €2.99: 10% of market price
 * - Under €0.50: €0.0025 (¼ cent)
 * 
 * All prices are rounded DOWN to 2 decimal places (except ¼ cent)
 */
export function calculateBuyPrice(marketPrice: number): number {
  let buyPrice: number

  if (marketPrice >= 3.00) {
    buyPrice = marketPrice * 0.50 // 50%
  } else if (marketPrice >= 0.50) {
    buyPrice = marketPrice * 0.10 // 10%
  } else {
    return 0.0025 // ¼ cent (no rounding for this special case)
  }

  // Round DOWN to 2 decimal places
  return Math.floor(buyPrice * 100) / 100
}

/**
 * Format price for display
 */
export function formatPrice(price: number): string {
  if (price < 0.01) {
    // Show fractions of cents for very small amounts
    return `€${price.toFixed(4)}`
  }
  return `€${price.toFixed(2)}`
}

/**
 * Get pricing tier description
 */
export function getPricingTier(marketPrice: number): string {
  if (marketPrice >= 3.00) {
    return '50%'
  } else if (marketPrice >= 0.50) {
    return '10%'
  } else {
    return '¼¢'
  }
}

/**
 * Get pricing explanation
 */
export function getPricingExplanation(marketPrice: number, language: 'en' | 'de' = 'en'): string {
  if (marketPrice >= 3.00) {
    return language === 'de' 
      ? `50% von €${marketPrice.toFixed(2)} (abgerundet)`
      : `50% of €${marketPrice.toFixed(2)} (rounded down)`
  } else if (marketPrice >= 0.50) {
    return language === 'de'
      ? `10% von €${marketPrice.toFixed(2)} (abgerundet)`
      : `10% of €${marketPrice.toFixed(2)} (rounded down)`
  } else {
    return language === 'de'
      ? '¼ Cent pro Karte'
      : '¼ cent per card'
  }
}