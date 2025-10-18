'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'

interface InventoryCard {
  id: string
  card_name: string
  set_name: string
  set_code: string
  collector_number: string
  condition: string
  language: string
  foil: boolean
  quantity: number
  purchase_price: number
  market_price: number
  image_url: string
  acquired_date: string
  submission_id: string
  notes: string
  created_at: string
}

export default function AdminInventory() {
  const [inventory, setInventory] = useState<InventoryCard[]>([])
  const [filteredInventory, setFilteredInventory] = useState<InventoryCard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterSet, setFilterSet] = useState('all')
  const [filterCondition, setFilterCondition] = useState('all')
  const [filterFoil, setFilterFoil] = useState('all')
  const [sortBy, setSortBy] = useState('date_desc')
  const [editingCard, setEditingCard] = useState<InventoryCard | null>(null)
  const [stats, setStats] = useState({
    totalCards: 0,
    totalValue: 0,
    uniqueCards: 0,
    averagePrice: 0
  })
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadInventory()
    }
  }, [loading])

  useEffect(() => {
    applyFiltersAndSort()
  }, [inventory, searchQuery, filterSet, filterCondition, filterFoil, sortBy])

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

    if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
      alert('Access denied')
      router.push('/admin')
      return
    }

    setLoading(false)
  }

  const loadInventory = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setInventory(data || [])
      calculateStats(data || [])
    } catch (error) {
      console.error('Error loading inventory:', error)
    }
  }

  const calculateStats = (data: InventoryCard[]) => {
    const totalCards = data.reduce((sum, card) => sum + card.quantity, 0)
    const totalValue = data.reduce((sum, card) => sum + (card.purchase_price * card.quantity), 0)
    const uniqueCards = new Set(data.map(card => card.card_name)).size
    const averagePrice = totalCards > 0 ? totalValue / totalCards : 0

    setStats({ totalCards, totalValue, uniqueCards, averagePrice })
  }

  const applyFiltersAndSort = () => {
    let filtered = [...inventory]

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(card =>
        card.card_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.set_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        card.set_code.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Set filter
    if (filterSet !== 'all') {
      filtered = filtered.filter(card => card.set_code === filterSet)
    }

    // Condition filter
    if (filterCondition !== 'all') {
      filtered = filtered.filter(card => card.condition === filterCondition)
    }

    // Foil filter
    if (filterFoil === 'foil') {
      filtered = filtered.filter(card => card.foil)
    } else if (filterFoil === 'nonfoil') {
      filtered = filtered.filter(card => !card.foil)
    }

    // Sorting
    switch (sortBy) {
      case 'date_desc':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case 'date_asc':
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case 'name_asc':
        filtered.sort((a, b) => a.card_name.localeCompare(b.card_name))
        break
      case 'name_desc':
        filtered.sort((a, b) => b.card_name.localeCompare(a.card_name))
        break
      case 'price_desc':
        filtered.sort((a, b) => b.purchase_price - a.purchase_price)
        break
      case 'price_asc':
        filtered.sort((a, b) => a.purchase_price - b.purchase_price)
        break
      case 'quantity_desc':
        filtered.sort((a, b) => b.quantity - a.quantity)
        break
      case 'quantity_asc':
        filtered.sort((a, b) => a.quantity - b.quantity)
        break
    }

    setFilteredInventory(filtered)
  }

  const handleUpdateCard = async () => {
    if (!editingCard) return

    try {
      const { error } = await supabase
        .from('inventory')
        .update({
          quantity: editingCard.quantity,
          purchase_price: editingCard.purchase_price,
          market_price: editingCard.market_price,
          notes: editingCard.notes,
        })
        .eq('id', editingCard.id)

      if (error) throw error

      alert('Card updated successfully!')
      setEditingCard(null)
      loadInventory()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteCard = async (id: string) => {
    if (!confirm('Delete this card from inventory? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('inventory')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Card deleted from inventory!')
      loadInventory()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const exportToCSV = () => {
    const csvData = [
      ['Card Name', 'Set', 'Set Code', 'Collector #', 'Condition', 'Language', 'Foil', 'Quantity', 'Purchase Price', 'Market Price', 'Total Value', 'Acquired Date', 'Notes'],
      ...filteredInventory.map(card => [
        card.card_name,
        card.set_name,
        card.set_code,
        card.collector_number,
        card.condition,
        card.language,
        card.foil ? 'Yes' : 'No',
        card.quantity,
        card.purchase_price.toFixed(2),
        card.market_price.toFixed(2),
        (card.purchase_price * card.quantity).toFixed(2),
        new Date(card.acquired_date).toLocaleDateString(),
        card.notes || ''
      ])
    ]

    const csv = csvData.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inventory-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  // Get unique sets for filter
  const uniqueSets = Array.from(new Set(inventory.map(card => card.set_code)))

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-cyan-500">Inventory Management</h1>
          </div>
          <button onClick={exportToCSV} className="btn-primary">
            📊 Export CSV
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl font-bold text-cyan-500">{stats.totalCards}</div>
            <div className="text-sm text-gray-400 mt-2">Total Cards</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-emerald-500">
              €{stats.totalValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Value</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-blue-500">{stats.uniqueCards}</div>
            <div className="text-sm text-gray-400 mt-2">Unique Cards</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-purple-500">
              €{stats.averagePrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Avg. Price per Card</div>
          </div>
        </div>

        {/* Filters */}
        <div className="card p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Search cards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
            />

            <select
              value={filterSet}
              onChange={(e) => setFilterSet(e.target.value)}
              className="input-field"
            >
              <option value="all">All Sets</option>
              {uniqueSets.map(set => (
                <option key={set} value={set}>{set.toUpperCase()}</option>
              ))}
            </select>

            <select
              value={filterCondition}
              onChange={(e) => setFilterCondition(e.target.value)}
              className="input-field"
            >
              <option value="all">All Conditions</option>
              <option value="NM">Near Mint</option>
              <option value="LP">Lightly Played</option>
              <option value="MP">Moderately Played</option>
              <option value="HP">Heavily Played</option>
              <option value="DMG">Damaged</option>
            </select>

            <select
              value={filterFoil}
              onChange={(e) => setFilterFoil(e.target.value)}
              className="input-field"
            >
              <option value="all">All Finishes</option>
              <option value="foil">Foil Only</option>
              <option value="nonfoil">Non-Foil Only</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="input-field"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
              <option value="price_desc">Price (High-Low)</option>
              <option value="price_asc">Price (Low-High)</option>
              <option value="quantity_desc">Quantity (High-Low)</option>
              <option value="quantity_asc">Quantity (Low-High)</option>
            </select>
          </div>

          <div className="mt-4 text-sm text-gray-400">
            Showing {filteredInventory.length} of {inventory.length} cards
          </div>
        </div>

        {/* Inventory Grid */}
        {filteredInventory.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No cards in inventory</h2>
            <p className="text-gray-400">
              {searchQuery || filterSet !== 'all' || filterCondition !== 'all' || filterFoil !== 'all'
                ? 'No cards match your filters. Try adjusting your search.'
                : 'Cards will appear here after you accept customer submissions.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInventory.map((card) => (
              <div key={card.id} className="card p-4">
                <div className="flex gap-4 mb-4">
                  {card.image_url && (
                    <SafeImage
                      src={card.image_url}
                      alt={card.card_name}
                      className="rounded"
                      style={{ width: '100px', height: 'auto' }}
                      unoptimized
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg mb-1 truncate">{card.card_name}</h3>
                    <p className="text-sm text-gray-400 truncate">
                      {card.set_name} ({card.set_code.toUpperCase()})
                    </p>
                    <p className="text-xs text-gray-500">#{card.collector_number}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Condition:</span>
                    <span className="font-semibold">{card.condition}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Language:</span>
                    <span className="font-semibold">{card.language.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Finish:</span>
                    <span className="font-semibold">
                      {card.foil ? 'Foil ✨' : 'Non-Foil'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Quantity:</span>
                    <span className="font-semibold text-cyan-500">{card.quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Purchase Price:</span>
                    <span className="font-semibold text-emerald-500">
                      €{card.purchase_price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Value:</span>
                    <span className="font-semibold text-blue-500">
                      €{(card.purchase_price * card.quantity).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Acquired:</span>
                    <span className="text-xs">
                      {new Date(card.acquired_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {card.notes && (
                  <div className="mb-4 p-2 bg-slate-800 rounded text-xs text-gray-400">
                    <strong>Notes:</strong> {card.notes}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCard(card)}
                    className="btn-outline flex-1 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCard(card.id)}
                    className="btn-outline text-sm text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Modal */}
        {editingCard && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Edit Inventory Card</h2>
              
              <div className="flex gap-4 mb-6">
                {editingCard.image_url && (
                  <SafeImage
                    src={editingCard.image_url}
                    alt={editingCard.card_name}
                    className="rounded"
                    style={{ width: '150px', height: 'auto' }}
                    unoptimized
                  />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">{editingCard.card_name}</h3>
                  <p className="text-sm text-gray-400">
                    {editingCard.set_name} ({editingCard.set_code.toUpperCase()}) #{editingCard.collector_number}
                  </p>
                  <p className="text-sm text-gray-400 mt-1">
                    {editingCard.condition} • {editingCard.language.toUpperCase()} • {editingCard.foil ? 'Foil' : 'Non-Foil'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Quantity</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCard.quantity}
                    onChange={(e) => setEditingCard({ ...editingCard, quantity: parseInt(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Purchase Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCard.purchase_price}
                    onChange={(e) => setEditingCard({ ...editingCard, purchase_price: parseFloat(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Market Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingCard.market_price}
                    onChange={(e) => setEditingCard({ ...editingCard, market_price: parseFloat(e.target.value) || 0 })}
                    className="input-field w-full"
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Notes</label>
                <textarea
                  value={editingCard.notes || ''}
                  onChange={(e) => setEditingCard({ ...editingCard, notes: e.target.value })}
                  placeholder="Add notes about this card..."
                  className="input-field w-full h-24 resize-none"
                />
              </div>

              <div className="bg-slate-800 p-3 rounded mb-6">
                <div className="text-sm text-gray-400 mb-1">Total Value:</div>
                <div className="text-2xl font-bold text-emerald-500">
                  €{(editingCard.purchase_price * editingCard.quantity).toFixed(2)}
                </div>
              </div>

              <div className="flex gap-3">
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