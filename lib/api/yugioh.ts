export interface YugiohCard {
  id: number
  name: string
  type: string
  desc: string
  race: string
  archetype?: string
  atk?: number
  def?: number
  level?: number
  attribute?: string
  card_sets?: Array<{
    set_name: string
    set_code: string
    set_rarity: string
    set_price: string
  }>
  card_images: Array<{
    id: number
    image_url: string
    image_url_small: string
  }>
  card_prices: Array<{
    cardmarket_price: string
    tcgplayer_price: string
    ebay_price: string
    amazon_price: string
  }>
}

const YUGIOH_API_BASE = 'https://db.ygoprodeck.com/api/v7'

export async function searchYugiohCards(query: string): Promise<YugiohCard[]> {
  try {
    const response = await fetch(
      `${YUGIOH_API_BASE}/cardinfo.php?fname=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      if (response.status === 404) {
        return [] // No cards found
      }
      throw new Error('Yu-Gi-Oh API request failed')
    }

    const data = await response.json()
    return data.data || []
  } catch (error) {
    console.error('Yu-Gi-Oh API error:', error)
    return []
  }
}

export function getYugiohCardPrice(card: YugiohCard): number {
  if (card.card_prices && card.card_prices.length > 0) {
    const price = parseFloat(card.card_prices[0].cardmarket_price || card.card_prices[0].tcgplayer_price || '0')
    return price
  }
  return 0
}

export function getYugiohCardImage(card: YugiohCard): string {
  if (card.card_images && card.card_images.length > 0) {
    return card.card_images[0].image_url
  }
  return ''
}

export function groupYugiohCardsBySet(card: YugiohCard): Array<{
  setName: string
  setCode: string
  rarity: string
  price: number
}> {
  if (!card.card_sets) return []
  
  return card.card_sets.map(set => ({
    setName: set.set_name,
    setCode: set.set_code,
    rarity: set.set_rarity,
    price: parseFloat(set.set_price || '0')
  }))
}