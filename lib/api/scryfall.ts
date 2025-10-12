export interface ScryfallCard {
  id: string
  name: string
  set: string
  set_name: string
  set_type: string
  collector_number: string
  image_uris?: {
    small?: string
    normal?: string
    large?: string
    png?: string
  }
  card_faces?: Array<{
    image_uris?: {
      small?: string
      normal?: string
      large?: string
      png?: string
    }
    name: string
  }>
  prices: {
    usd: string | null
    usd_foil: string | null
    eur: string | null
    eur_foil: string | null
    tix: string | null
  }
  lang: string
  printed_name?: string
  promo: boolean
  finishes: string[]
  frame_effects?: string[]
  border_color: string
  [key: string]: any
}

// Helper to call our API proxy
async function scryfallFetch(endpoint: string): Promise<any> {
  try {
    const url = `/api/scryfall?endpoint=${encodeURIComponent(endpoint)}`
    console.log('Fetching:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('API proxy error:', response.status, url)
      return { data: [] }
    }
    
    const data = await response.json()
    
    if (data.code === 'rate_limit') {
      console.warn('Rate limit hit, returning empty results')
      return { data: [] }
    }
    
    return data
  } catch (error) {
    console.error('Fetch error:', error)
    return { data: [] }
  }
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Search with language support
export async function searchMTGCards(query: string, language: string = 'en'): Promise<ScryfallCard[]> {
  try {
    console.log('🔍 Searching Scryfall:', query, 'Language:', language)
    
    const encodedQuery = encodeURIComponent(query)
    const langFilter = language === 'de' ? '+lang:de' : '+lang:en'
    
    const url = `https://api.scryfall.com/cards/search?q=${encodedQuery}${langFilter}&unique=prints`
    
    console.log('📡 Search query:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ No results found')
        return []
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }
    
    const data = await response.json()
    console.log('✅ Scryfall returned:', data.data?.length || 0, 'cards')
    
    return data.data || []
  } catch (error) {
    console.error('❌ Scryfall search error:', error)
    return []
  }
}

export async function getMTGCardByName(name: string): Promise<ScryfallCard | null> {
  try {
    const response = await fetch(
      `https://api.scryfall.com/cards/named?fuzzy=${encodeURIComponent(name)}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }

    const card = await response.json()
    
    // Log to debug
    console.log('Card from Scryfall:', {
      name: card.name,
      prices: card.prices,
      eur: card.prices?.eur,
      usd: card.prices?.usd
    })
    
    return card
  } catch (error) {
    console.error('Error fetching MTG card:', error)
    return null
  }
}

export async function getMTGCardPrints(cardName: string, language: string = 'en'): Promise<ScryfallCard[]> {
  try {
    const encodedName = encodeURIComponent(`!"${cardName}"`)
    const url = `https://api.scryfall.com/cards/search?q=${encodedName}&unique=prints&order=released`
    
    console.log('🔍 Fetching prints for:', cardName)
    console.log('📡 URL:', url)
    
    const response = await fetch(url)
    
    if (!response.ok) {
      console.error('❌ Scryfall API error:', response.status, response.statusText)
      return []
    }
    
    const data = await response.json()
    
    console.log('📦 Total prints from API:', data.data?.length || 0)
    
    // Log ALL prices for debugging
    if (data.data && data.data.length > 0) {
      console.log('💰 PRICE DEBUG - All prints:')
      data.data.forEach((card: ScryfallCard, index: number) => {
        console.log(`  ${index + 1}. ${card.set.toUpperCase()} #${card.collector_number}:`)
        console.log(`     EUR: ${card.prices?.eur || 'null'}`)
        console.log(`     USD: ${card.prices?.usd || 'null'}`)
        console.log(`     USD Foil: ${card.prices?.usd_foil || 'null'}`)
        console.log(`     Tix: ${card.prices?.tix || 'null'}`)
        console.log(`     Full prices object:`, card.prices)
      })
    }
    
    return data.data || []
  } catch (error) {
    console.error('❌ Error fetching prints:', error)
    return []
  }
}

export async function getCardInLanguage(setCode: string, collectorNumber: string, language: string): Promise<ScryfallCard | null> {
  try {
    const langCode = language === 'de' ? 'de' : 'en'
    const endpoint = `/cards/${setCode.toLowerCase()}/${collectorNumber}/${langCode}`
    const card = await scryfallFetch(endpoint)
    
    if (card.object === 'error' || !card.id) {
      if (language === 'de') {
        await delay(150)
        const enEndpoint = `/cards/${setCode.toLowerCase()}/${collectorNumber}/en`
        const enCard = await scryfallFetch(enEndpoint)
        
        if (enCard.id) {
          return enCard
        }
      }
      return null
    }
    
    return card
  } catch (error) {
    console.error('Error fetching card in language:', error)
    return null
  }
}

export function getCardImageUrl(card: ScryfallCard): string {
  if (card.image_uris?.normal) {
    return card.image_uris.normal
  }
  
  if (card.image_uris?.large) {
    return card.image_uris.large
  }
  
  if (card.card_faces && card.card_faces[0]?.image_uris) {
    return card.card_faces[0].image_uris.normal || card.card_faces[0].image_uris.large || ''
  }
  
  return ''
}

export function getCardDisplayName(card: any, preferGerman: boolean = false): string {
  console.log('🔍 getCardDisplayName called:', {
    preferGerman,
    cardName: card.name,
    cardLang: card.lang,
    printedName: card.printed_name,
    hasPrintedName: !!card.printed_name
  })
  
  // If we don't want German, just return English name
  if (!preferGerman) {
    console.log('  → Returning English name:', card.name)
    return card.name
  }
  
  // If this IS a German card (lang === 'de'), use printed_name
  if (card.lang === 'de' && card.printed_name) {
    console.log('  → German card found, returning printed_name:', card.printed_name)
    return card.printed_name
  }
  
  // If the card has a printed_name (non-English card)
  if (card.printed_name) {
    console.log('  → Found printed_name:', card.printed_name)
    return card.printed_name
  }
  
  // Check card_faces for double-faced cards
  if (card.card_faces && card.card_faces.length > 0) {
    const frontFace = card.card_faces[0]
    if (frontFace.printed_name) {
      console.log('  → Found printed_name in card_faces:', frontFace.printed_name)
      return frontFace.printed_name
    }
  }
  
  // Fallback to English name
  console.log('  → No German name found, fallback to English:', card.name)
  return card.name
}