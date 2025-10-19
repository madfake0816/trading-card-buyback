/**
 * Client wrapper for /api/pokemon
 * Works with Unified API from /app/api/pokemon/route.ts
 */

export type UnifiedImageSet = {
  small: string
  large: string
  png?: string | null
}

export type UnifiedSet = {
  code: string
  name: string
  series?: string
  releaseDate?: string
}

export type UnifiedPrices = {
  currency: 'EUR'
  market: number
  sources: {
    cardmarket?: { trend?: number; url?: string }
    tcgplayer?: { market?: number; currency?: 'USD' | 'EUR' }
  }
}

export type UnifiedPrint = {
  id: string
  name: string
  number: string
  rarity?: string
  types?: string[]
  supertype?: string
  subtypes?: string[]
  images: UnifiedImageSet
  set: UnifiedSet
  prices: UnifiedPrices
  buyPrice: number
}

export type UnifiedCard = {
  object: 'card'
  id: string
  name: string
  primary: UnifiedPrint
  prints: UnifiedPrint[]
}

/**
 * Search unified Pokémon cards (returns primaries for list view)
 */
export async function searchPokemonCards(
  query: string
): Promise<UnifiedPrint[]> {
  if (!query || query.length < 2) return []

  const url = `/api/pokemon?q=${encodeURIComponent(query)}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) throw new Error(`Pokemon API failed: ${res.status}`)
  const data = await res.json()

  if (!data?.data || !Array.isArray(data.data)) return []

  // Flatten: primaries
  const allPrints: UnifiedPrint[] = data.data.map((card: UnifiedCard) => card.primary)
  return allPrints
}

/**
 * Fetch all prints of a given Pokémon card (by name)
 */
export async function getPokemonCardPrints(name: string): Promise<UnifiedPrint[]> {
  const url = `/api/pokemon?q=${encodeURIComponent(name)}`
  const res = await fetch(url, { cache: 'no-store' })

  if (!res.ok) throw new Error(`Pokemon API failed: ${res.status}`)
  const data = await res.json()
  if (!data?.data || !Array.isArray(data.data)) return []

  const cards: UnifiedCard[] = data.data
  const card = cards.find((c) => c.name.toLowerCase() === name.toLowerCase())
  if (!card) return []
  return card.prints || []
}

/**
 * Best image for a Pokémon card print
 */
export function getPokemonCardImage(card: UnifiedPrint): string {
  return (
    card.images.large ||
    card.images.small ||
    card.images.png ||
    '/placeholder-card.png'
  )
}

/**
 * Display name (currently passthrough)
 */
export function getPokemonCardDisplayName(card: UnifiedPrint): string {
  return card.name
}
