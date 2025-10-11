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
    console.log('🔍 Searching Scryfall:', { query, language })
    
    // Build search query
    let searchQuery = query
    
    // If German mode, add language filter to get German cards
    if (language === 'de') {
      searchQuery = `${query} lang:de`
    }
    
    console.log('📡 Search query:', searchQuery)
    
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=${encodeURIComponent(searchQuery)}&unique=prints&order=released`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ No results found')
        
        // If no German results found, try searching in English
        if (language === 'de') {
          console.log('🔄 Trying English search as fallback...')
          const fallbackResponse = await fetch(
            `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released`,
            {
              headers: {
                'Accept': 'application/json',
              },
            }
          )
          
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json()
            console.log('✅ Fallback found:', fallbackData.data?.length || 0, 'English cards')
            return fallbackData.data || []
          }
        }
        
        return []
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }

    const data = await response.json()
    
    console.log('✅ Scryfall returned:', data.data?.length || 0, 'cards')
    
    // Log first card to debug
    if (data.data && data.data.length > 0) {
      console.log('First card:', {
        name: data.data[0].name,
        lang: data.data[0].lang,
        printed_name: data.data[0].printed_name,
        prices: data.data[0].prices
      })
    }
    
    return data.data || []
  } catch (error) {
    console.error('❌ Error searching MTG cards:', error)
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
    const response = await fetch(
      `https://api.scryfall.com/cards/search?q=!"${encodeURIComponent(cardName)}"&unique=prints&order=released`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return []
      }
      throw new Error(`Scryfall API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Log to debug
    if (data.data && data.data.length > 0) {
      console.log('Prints found:', data.data.length)
      console.log('First print prices:', data.data[0].prices)
    }
    
    return data.data || []
  } catch (error) {
    console.error('Error fetching card prints:', error)
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