'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'
import { searchMTGCards, getCardImageUrl } from '@/lib/api/scryfall'
import { searchPokemonCards, getPokemonCardPrice, getPokemonCardImage } from '@/lib/api/pokemon'
import { searchYugiohCards, getYugiohCardPrice, getYugiohCardImage } from '@/lib/api/yugioh'
import { calculateBuyPrice } from '@/lib/pricing'

interface FeaturedCard {
  id: string
  card_name: string
  set_code: string
  set_name: string
  image_url: string
  market_price: number
  buy_price: number
  display_order: number
  active: boolean
  created_at: string
}

export default function AdminFeaturedCards() {
  const [cards, setCards] = useState<FeaturedCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [editingCard, setEditingCard] = useState<FeaturedCard | null>(null)
  const router = useRouter()
  const supabase = createClient()
 const [selectedTCG, setSelectedTCG] = useState<string>('Magic: The Gathering')
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      alert('Access denied - Admin/Owner only')
      router.push('/admin')
      return
    }

    setLoading(false)
    loadCards()
  }

  const loadCards = async () => {
    try {
      const { data, error } = await supabase
        .from('featured_buylist')
        .select('*')
        .order('display_order', { ascending: true })

      if (error) throw error

      setCards(data || [])
    } catch (error) {
      console.error('Error loading cards:', error)
    }
  }

  const handleSearch = async () => {
  if (!searchQuery || searchQuery.length < 2) {
    alert('Please enter at least 2 characters')
    return
  }

  setSearching(true)
  try {
    let results: any[] = []

    if (selectedTCG === 'Magic: The Gathering') {
      results = await searchMTGCards(searchQuery, 'en')
    } else if (selectedTCG === 'Pokémon') {
      results = await searchPokemonCards(searchQuery)
    } else if (selectedTCG === 'Yu-Gi-Oh!') {
      results = await searchYugiohCards(searchQuery)
    }

    const cardsWithPrices = results
      .filter(card => {
        if (selectedTCG === 'Magic: The Gathering') {
          const price = parseFloat(card.prices?.eur || card.prices?.usd || '0')
          return price > 0
        } else if (selectedTCG === 'Pokémon') {
          return getPokemonCardPrice(card) > 0
        } else if (selectedTCG === 'Yu-Gi-Oh!') {
          return getYugiohCardPrice(card) > 0
        }
        return false
      })
      .slice(0, 20)

    setSearchResults(cardsWithPrices)
  } catch (error) {
    console.error('Search error:', error)
    alert('Search failed. Please try again.')
  } finally {
    setSearching(false)
  }
}

const handleAddCard = async (card: any) => {
  try {
    let marketPrice = 0
    let cardName = ''
    let setCode = ''
    let setName = ''
    let imageUrl = ''

    if (selectedTCG === 'Magic: The Gathering') {
      marketPrice = parseFloat(card.prices?.eur || card.prices?.usd || '0')
      cardName = card.name
      setCode = card.set.toUpperCase()
      setName = card.set_name
      imageUrl = getCardImageUrl(card)
    } else if (selectedTCG === 'Pokémon') {
      marketPrice = getPokemonCardPrice(card)
      cardName = card.name
      setCode = card.set.id
      setName = card.set.name
      imageUrl = getPokemonCardImage(card)
    } else if (selectedTCG === 'Yu-Gi-Oh!') {
      marketPrice = getYugiohCardPrice(card)
      cardName = card.name
      setCode = card.card_sets?.[0]?.set_code || 'BASE'
      setName = card.card_sets?.[0]?.set_name || 'Base Set'
      imageUrl = getYugiohCardImage(card)
    }

    const buyPrice = calculateBuyPrice(marketPrice)

    const newCard = {
      card_name: cardName,
      set_code: setCode,
      set_name: setName,
      image_url: imageUrl,
      market_price: marketPrice,
      buy_price: buyPrice,
      display_order: cards.length,
      active: true,
      tcg: selectedTCG
    }

    const { error } = await supabase
      .from('featured_buylist')
      .insert([newCard])

    if (error) throw error

    alert('Card added to featured buylist!')
    setSearchQuery('')
    setSearchResults([])
    loadCards()
  } catch (error: any) {
    alert(`Error: ${error.message}`)
  }
}

  const handleUpdateCard = async () => {
    if (!editingCard) return

    try {
      const { error } = await supabase
        .from('featured_buylist')
        .update({
          buy_price: editingCard.buy_price,
          market_price: editingCard.market_price,
          display_order: editingCard.display_order,
          active: editingCard.active
        })
        .eq('id', editingCard.id)

      if (error) throw error

      alert('Card updated!')
      setEditingCard(null)
      loadCards()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Remove this card from featured buylist?')) return

    try {
      const { error } = await supabase
        .from('featured_buylist')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Card removed!')
      loadCards()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleToggleActive = async (card: FeaturedCard) => {
    try {
      const { error } = await supabase
        .from('featured_buylist')
        .update({ active: !card.active })
        .eq('id', card.id)

      if (error) throw error

      loadCards()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-cyan-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-cyan-500 mb-2">Featured Buylist</h1>
          <p className="text-gray-400">Manage cards displayed on the homepage</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl font-bold text-cyan-500">{cards.length}</div>
            <div className="text-sm text-gray-400 mt-2">Total Featured Cards</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold text-green-500">
              {cards.filter(c => c.active).length}
            </div>
            <div className="text-sm text-gray-400 mt-2">Active Cards</div>
          </div>
          <div className="card p-6">
            <div className="text-3xl font-bold text-emerald-500">
              €{cards.filter(c => c.active).reduce((sum, c) => sum + c.buy_price, 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Buy Value</div>
          </div>
        </div>

        {/* Add New Card */}
        {/* Add New Card */}
<div className="card p-6 mb-8">
  <h2 className="text-2xl font-bold text-cyan-500 mb-4">Add New Featured Card</h2>
  
  {/* TCG Selector - ADD THIS */}
  <div className="mb-4">
    <label className="block text-sm font-semibold mb-2 text-white">Select Trading Card Game</label>
    <select
      value={selectedTCG}
      onChange={(e) => {
        setSelectedTCG(e.target.value)
        setSearchResults([]) // Clear results when switching
      }}
      className="input-field w-full"
    >
      <option value="Magic: The Gathering">Magic: The Gathering</option>
      <option value="Pokémon">Pokémon</option>
      <option value="Yu-Gi-Oh!">Yu-Gi-Oh!</option>
    </select>
  </div>

  <div className="flex gap-4 mb-4">
    <input
      type="text"
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
      placeholder={`Search for ${selectedTCG} cards...`}
      className="input-field flex-1"
    />
    <button
      onClick={handleSearch}
      disabled={searching}
      className="btn-primary"
    >
      {searching ? 'Searching...' : 'Search'}
    </button>
  </div>

  {/* Search Results */}
  {searchResults.length > 0 && (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mt-6">
      {searchResults.map((card, index) => {
        let marketPrice = 0
        let buyPrice = 0
        let imageUrl = ''
        let cardName = ''
        let setName = ''

        if (selectedTCG === 'Magic: The Gathering') {
          marketPrice = parseFloat(card.prices?.eur || card.prices?.usd || '0')
          buyPrice = calculateBuyPrice(marketPrice)
          imageUrl = getCardImageUrl(card)
          cardName = card.name
          setName = card.set_name
        } else if (selectedTCG === 'Pokémon') {
          marketPrice = getPokemonCardPrice(card)
          buyPrice = calculateBuyPrice(marketPrice)
          imageUrl = getPokemonCardImage(card)
          cardName = card.name
          setName = card.set.name
        } else if (selectedTCG === 'Yu-Gi-Oh!') {
          marketPrice = getYugiohCardPrice(card)
          buyPrice = calculateBuyPrice(marketPrice)
          imageUrl = getYugiohCardImage(card)
          cardName = card.name
          setName = card.card_sets?.[0]?.set_name || 'Base Set'
        }
        
        return (
          <div key={index} className="bg-slate-800 rounded-lg p-3">
            <SafeImage
              src={imageUrl}
              alt={cardName}
              className="w-full rounded mb-2"
              unoptimized
            />
            <h4 className="font-bold text-sm mb-1 truncate" title={cardName}>
              {cardName}
            </h4>
            <p className="text-xs text-gray-400 mb-2 truncate">
              {setName}
            </p>
            <div className="text-xs text-emerald-500 font-bold mb-2">
              Buy: €{buyPrice.toFixed(2)}
            </div>
            <button
              onClick={() => handleAddCard(card)}
              className="btn-primary w-full text-xs py-1"
            >
              Add to Featured
            </button>
          </div>
        )
      })}
    </div>
  )}
</div>

        {/* Current Featured Cards */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-6">Current Featured Cards</h2>
          
          {cards.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold mb-2">No Featured Cards</h3>
              <p className="text-gray-400">Search and add cards to display on the homepage</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {cards.map((card) => (
                <div key={card.id} className={`bg-slate-800 rounded-lg p-4 ${!card.active && 'opacity-50'}`}>
                  {card.image_url && (
                    <SafeImage
                      src={card.image_url}
                      alt={card.card_name}
                      className="w-full rounded mb-3"
                      unoptimized
                    />
                  )}
                  <h4 className="font-bold mb-1 truncate" title={card.card_name}>
                    {card.card_name}
                  </h4>
                  <p className="text-sm text-gray-400 mb-3 truncate">
                    {card.set_name} ({card.set_code})
                  </p>
                  
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Market:</span>
                      <span>€{card.market_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Buy Price:</span>
                      <span className="text-emerald-500 font-bold">€{card.buy_price.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order:</span>
                      <span>{card.display_order}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className={card.active ? 'text-green-500' : 'text-red-500'}>
                        {card.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => setEditingCard(card)}
                      className="btn-outline w-full text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleActive(card)}
                      className={`btn-outline w-full text-sm ${card.active ? 'text-yellow-500 border-yellow-500' : 'text-green-500 border-green-500'}`}
                    >
                      {card.active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="btn-outline w-full text-sm text-red-500 border-red-500"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Edit Featured Card</h2>
              
              <div className="mb-4">
                <SafeImage
                  src={editingCard.image_url}
                  alt={editingCard.card_name}
                  className="w-full rounded mb-3"
                  unoptimized
                />
                <h3 className="font-bold text-lg">{editingCard.card_name}</h3>
                <p className="text-sm text-gray-400">{editingCard.set_name}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Market Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCard.market_price}
                    onChange={(e) => setEditingCard({ ...editingCard, market_price: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Buy Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCard.buy_price}
                    onChange={(e) => setEditingCard({ ...editingCard, buy_price: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Display Order</label>
                  <input
                    type="number"
                    value={editingCard.display_order}
                    onChange={(e) => setEditingCard({ ...editingCard, display_order: parseInt(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingCard.active}
                    onChange={(e) => setEditingCard({ ...editingCard, active: e.target.checked })}
                    className="w-5 h-5"
                  />
                  <label className="text-sm font-semibold">Active (shown on homepage)</label>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={handleUpdateCard} className="btn-primary flex-1">
                  Save Changes
                </button>
                <button onClick={() => setEditingCard(null)} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}