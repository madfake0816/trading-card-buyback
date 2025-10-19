// app/api/pokemon/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

/**
 * ─────────────────────────────────────────────────────────
 *  Types – Unified (Scryfall-like) response
 * ─────────────────────────────────────────────────────────
 */
type UnifiedImageSet = {
  small: string
  large: string
  png?: string | null
}

type UnifiedSet = {
  code: string
  name: string
  series?: string
  releaseDate?: string
}

type UnifiedPrices = {
  currency: 'EUR'
  market: number // final market price (EUR)
  sources: {
    cardmarket?: { trend?: number; url?: string }
    tcgplayer?: { market?: number; currency?: 'USD' | 'EUR' }
  }
}

type UnifiedPrint = {
  id: string
  name: string
  number: string // collector number
  rarity?: string
  types?: string[]
  supertype?: string
  subtypes?: string[]
  images: UnifiedImageSet
  set: UnifiedSet
  prices: UnifiedPrices
  buyPrice: number
}

type UnifiedCard = {
  object: 'card'
  id: string
  name: string
  primary: UnifiedPrint
  prints: UnifiedPrint[]
}

/**
 * ─────────────────────────────────────────────────────────
 *  Original Pokémon TCG API types (minimal subset)
 * ─────────────────────────────────────────────────────────
 */
interface PokemonCard {
  id: string
  name: string
  supertype: string
  subtypes: string[]
  hp?: string
  types?: string[]
  rarity?: string
  set: {
    id: string
    name: string
    series: string
    printedTotal: number
    total: number
    releaseDate: string
    images: { symbol: string; logo: string }
  }
  number: string
  artist?: string
  images: { small: string; large: string }
  tcgplayer?: {
    prices?: {
      holofoil?: { market?: number }
      reverseHolofoil?: { market?: number }
      normal?: { market?: number }
      '1stEditionHolofoil'?: { market?: number }
    }
  }
  cardmarket?: {
    prices?: {
      averageSellPrice?: number
      avg1?: number
      avg7?: number
      avg30?: number
      trendPrice?: number
    }
  }
}

interface PokemonSearchResponse {
  data: PokemonCard[]
  page: number
  pageSize: number
  count: number
  totalCount: number
}

/**
 * ─────────────────────────────────────────────────────────
 *  Config & helpers
 * ─────────────────────────────────────────────────────────
 */
const POKEMON_API_BASE = 'https://api.pokemontcg.io/v2'
const POKEMON_API_KEY = process.env.POKEMON_TCG_API_KEY || '' // optional
const USD_TO_EUR = Number(process.env.USD_TO_EUR || 0.92)
const FETCH_TIMEOUT_MS = 12_000
const MAX_RETRIES = 2

// Balanced Ankauf (Option C)
function calcBuyPriceBalancedC(marketEur: number): number {
  if (marketEur >= 10) return round2(marketEur * 0.55)
  if (marketEur >= 1) return round2(marketEur * 0.25)
  if (marketEur >= 0.5) return 0.25
  return 0.10
}

function round2(n: number) {
  return Math.round(n * 100) / 100
}

function withTimeout<T>(p: Promise<T>, ms: number) {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    ),
  ])
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  let lastErr: unknown = null
  for (let i = 0; i <= MAX_RETRIES; i++) {
    try {
      const res = await withTimeout(
        fetch(url, {
          ...init,
          headers: {
            'user-agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36',
            ...init?.headers,
          },
        }),
        FETCH_TIMEOUT_MS
      )
      const r = res as Response
      if (!r.ok) throw new Error(`HTTP ${r.status}`)
      return await r.text()
    } catch (err) {
      lastErr = err
      if (i === MAX_RETRIES) break
      await new Promise((r) => setTimeout(r, 250 * (i + 1)))
    }
  }
  throw lastErr ?? new Error('Fetch failed')
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const txt = await fetchText(url, init)
  return JSON.parse(txt) as T
}

/**
 * ─────────────────────────────────────────────────────────
 *  Upstream fetch: Pokémon TCG API (primary data)
 * ─────────────────────────────────────────────────────────
 */
async function searchPokemonCards(query: string): Promise<PokemonCard[]> {
  // Name: "query"* + sort by latest set
  const url = `${POKEMON_API_BASE}/cards?q=name:"${encodeURIComponent(
    query
  )}"*&pageSize=50&orderBy=-set.releaseDate`

  const headers: Record<string, string> = {}
  if (POKEMON_API_KEY) headers['X-Api-Key'] = POKEMON_API_KEY

  const data = await fetchJson<PokemonSearchResponse>(url, { headers })
  return data.data || []
}

/**
 * ─────────────────────────────────────────────────────────
 *  Cardmarket HTML Scraper (CM1: Name + Set)
 *  - Schritt 1: Suchseite → erster Produktlink
 *  - Schritt 2: Produktseite → <dt>Trend Price</dt><dd>€ X,XX</dd>
 * ─────────────────────────────────────────────────────────
 */
const CM_BASE = 'https://www.cardmarket.com'

async function scrapeCardmarketProductUrl(name: string, setName: string): Promise<string | null> {
  const q = encodeURIComponent(`${name} ${setName}`)
  const searchUrl = `${CM_BASE}/en/Pokemon/Products/Search?searchString=${q}`
  const html = await fetchText(searchUrl)

  // Suche nach einem Produktlink unter Singles:
  // Beispiel: /en/Pokemon/Products/Singles/<Set>/<Card-Name>
  const linkRegex = /href="(\/en\/Pokemon\/Products\/Singles\/[^"]+)"/i
  const m = linkRegex.exec(html)
  if (m?.[1]) {
    return `${CM_BASE}${m[1]}`
  }
  return null
}

function parseEuroToNumber(raw: string): number {
  // Entfernt € und Nicht-Ziffern außer Trennzeichen, wandelt EU-Format (.,) in Punkt-Format
  const cleaned = raw
    .replace(/\u00A0/g, ' ')
    .replace(/[^\d.,]/g, '')
    .trim()

  // Beispiele: "3,25" → 3.25 ; "12.345,67" → 12345.67
  const parts = cleaned.split(',')
  if (parts.length === 1) {
    // Keine Dezimalstelle, evtl. "12.345"
    return Number(parts[0].replace(/\./g, '')) || 0
  }
  const integer = parts.slice(0, -1).join(',').replace(/[.,]/g, '')
  const decimal = parts[parts.length - 1]
  const num = Number(`${integer}.${decimal}`)
  return isNaN(num) ? 0 : num
}

async function scrapeCardmarketTrend(name: string, setName: string): Promise<{ trend: number; url: string } | null> {
  try {
    const productUrl = await scrapeCardmarketProductUrl(name, setName)
    if (!productUrl) return null

    const html = await fetchText(productUrl)

    // Suche nach "Trend Price" Definition List
    // <dt>Trend Price</dt><dd>€ 3,25</dd>
    const blockRegex = /<dt[^>]*>\s*Trend Price\s*<\/dt>\s*<dd[^>]*>(.*?)<\/dd>/i
    const match = blockRegex.exec(html)
    if (!match?.[1]) return null

    const priceText = match[1]
    const eur = round2(parseEuroToNumber(priceText))
    if (eur > 0) return { trend: eur, url: productUrl }
    return null
  } catch {
    return null
  }
}

/**
 * ─────────────────────────────────────────────────────────
 *  Price aggregation (Cardmarket Trend via HTML → TCGplayer → 0)
 * ─────────────────────────────────────────────────────────
 */
async function bestMarketPriceEur(card: PokemonCard): Promise<{
  price: number
  sources: UnifiedPrices['sources']
}> {
  const sources: UnifiedPrices['sources'] = {}

  // 1) Cardmarket Trend (HTML Scrape)
  const cm = await scrapeCardmarketTrend(card.name, card.set?.name)
  if (cm && cm.trend > 0) {
    sources.cardmarket = { trend: cm.trend, url: cm.url }
    return { price: cm.trend, sources }
  }

  // 2) TCGplayer (USD → EUR) aus pokemontcg.io Daten
  const tp = card.tcgplayer?.prices
  if (tp) {
    const usd =
      tp.holofoil?.market ??
      tp.reverseHolofoil?.market ??
      tp.normal?.market ??
      tp['1stEditionHolofoil']?.market ??
      0
    if (usd && usd > 0) {
      const eur = round2(usd * USD_TO_EUR)
      sources.tcgplayer = { market: round2(usd), currency: 'USD' }
      return { price: eur, sources }
    }
  }

  // 3) Kein Preis
  return { price: 0, sources }
}

/**
 * ─────────────────────────────────────────────────────────
 *  Transform single card → UnifiedPrint
 * ─────────────────────────────────────────────────────────
 */
async function toUnifiedPrint(card: PokemonCard): Promise<UnifiedPrint> {
  const { price, sources } = await bestMarketPriceEur(card)

  return {
    id: card.id,
    name: card.name,
    number: card.number,
    rarity: card.rarity,
    types: card.types,
    supertype: card.supertype,
    subtypes: card.subtypes,
    images: {
      small: card.images.small,
      large: card.images.large,
      png: card.images.large || null,
    },
    set: {
      code: (card.set?.id || '').toUpperCase(),
      name: card.set?.name,
      series: card.set?.series,
      releaseDate: card.set?.releaseDate,
    },
    prices: {
      currency: 'EUR',
      market: price,
      sources,
    },
    buyPrice: calcBuyPriceBalancedC(price),
  }
}

/**
 * ─────────────────────────────────────────────────────────
 *  Multi-print grouping
 * ─────────────────────────────────────────────────────────
 */
function groupByName(cards: PokemonCard[]): Record<string, PokemonCard[]> {
  return cards.reduce((acc, c) => {
    const key = c.name.trim().toLowerCase()
    if (!acc[key]) acc[key] = []
    acc[key].push(c)
    return acc
  }, {} as Record<string, PokemonCard[]>)
}

function dedupePrints(prints: UnifiedPrint[]): UnifiedPrint[] {
  const seen = new Set<string>()
  return prints.filter((p) => {
    const key = `${p.set.code}#${p.number}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * ─────────────────────────────────────────────────────────
 *  API Route (GET /api/pokemon?q=...)
 * ─────────────────────────────────────────────────────────
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  if (!q || q.length < 2) {
    return NextResponse.json(
      { object: 'list', data: [], warnings: ['Query too short'] },
      { status: 200 }
    )
  }

  try {
    // 1) Upstream search
    const raw = await searchPokemonCards(q)
    if (!raw.length) {
      return NextResponse.json(
        { object: 'list', data: [], warnings: ['No results'] },
        { status: 200 }
      )
    }

    // 2) Group by name → build Scryfall-like objects
    const byName = groupByName(raw)

    const unifiedCards: UnifiedCard[] = []
    for (const group of Object.values(byName)) {
      // Alle Prints parallel (aber begrenzt) scrapen/transformieren
      const printsResolved = await Promise.all(
        group.map((c) => toUnifiedPrint(c))
      )

      const prints = dedupePrints(
        printsResolved.sort((a, b) => {
          const da = Date.parse(a.set.releaseDate || '1970-01-01')
          const db = Date.parse(b.set.releaseDate || '1970-01-01')
          if (db !== da) return db - da
          return (b.prices.market || 0) - (a.prices.market || 0)
        })
      )

      const primary = prints[0]
      unifiedCards.push({
        object: 'card',
        id: primary.id,
        name: primary.name,
        primary,
        prints,
      })
    }

    return NextResponse.json(
      {
        object: 'list',
        total: unifiedCards.length,
        data: unifiedCards,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('Pokemon route error:', err)
    return NextResponse.json(
      { object: 'error', message: 'Failed to fetch Pokémon data' },
      { status: 500 }
    )
  }
}
