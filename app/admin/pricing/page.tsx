'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface PricingTier {
  id: string
  name: string
  min_price: number
  max_price: number
  percentage: number
  active: boolean
  created_at: string
}

export default function AdminPricing() {
  const [tiers, setTiers] = useState<PricingTier[]>([])
  const [loading, setLoading] = useState(true)
  const [editingTier, setEditingTier] = useState<PricingTier | null>(null)
  const [newTier, setNewTier] = useState({
    name: '',
    min_price: 0,
    max_price: 0,
    percentage: 0,
  })
  const router = useRouter()
  const supabase = createClient()

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
    loadTiers()
  }

  const loadTiers = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_tiers')
        .select('*')
        .order('min_price', { ascending: true })

      if (error) throw error

      setTiers(data || [])
    } catch (error) {
      console.error('Error loading tiers:', error)
    }
  }

  const handleCreateTier = async () => {
    try {
      const { error } = await supabase
        .from('pricing_tiers')
        .insert([{
          ...newTier,
          active: true
        }])

      if (error) throw error

      alert('Pricing tier created!')
      setNewTier({ name: '', min_price: 0, max_price: 0, percentage: 0 })
      loadTiers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleUpdateTier = async () => {
    if (!editingTier) return

    try {
      const { error } = await supabase
        .from('pricing_tiers')
        .update({
          name: editingTier.name,
          min_price: editingTier.min_price,
          max_price: editingTier.max_price,
          percentage: editingTier.percentage,
          active: editingTier.active
        })
        .eq('id', editingTier.id)

      if (error) throw error

      alert('Tier updated!')
      setEditingTier(null)
      loadTiers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteTier = async (id: string) => {
    if (!confirm('Delete this pricing tier?')) return

    try {
      const { error } = await supabase
        .from('pricing_tiers')
        .delete()
        .eq('id', id)

      if (error) throw error

      alert('Tier deleted!')
      loadTiers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const toggleTierActive = async (tier: PricingTier) => {
    try {
      const { error } = await supabase
        .from('pricing_tiers')
        .update({ active: !tier.active })
        .eq('id', tier.id)

      if (error) throw error

      loadTiers()
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
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-cyan-500 mb-2">Pricing Rules</h1>
          <p className="text-gray-400">Configure buylist pricing tiers based on card market value</p>
        </div>

        {/* Current Tiers */}
        <div className="card p-6 mb-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Current Pricing Tiers</h2>
          <div className="space-y-3">
            {tiers.map((tier) => (
              <div key={tier.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      tier.active ? 'bg-green-600' : 'bg-gray-600'
                    }`}>
                      {tier.active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-400">
                    Price Range: €{tier.min_price.toFixed(2)} - €{tier.max_price === 999999 ? '∞' : tier.max_price.toFixed(2)}
                  </div>
                  <div className="text-sm text-emerald-500 font-semibold">
                    Buy at {tier.percentage}% of market price
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleTierActive(tier)}
                    className="btn-outline text-sm"
                  >
                    {tier.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setEditingTier(tier)}
                    className="btn-outline text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="btn-outline text-sm text-red-500 border-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create New Tier */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Create New Tier</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Tier Name</label>
              <input
                type="text"
                value={newTier.name}
                onChange={(e) => setNewTier({ ...newTier, name: e.target.value })}
                placeholder="e.g., Budget Cards"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Buy Percentage (%)</label>
              <input
                type="number"
                value={newTier.percentage}
                onChange={(e) => setNewTier({ ...newTier, percentage: parseFloat(e.target.value) })}
                placeholder="50"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Min Price (€)</label>
              <input
                type="number"
                step="0.01"
                value={newTier.min_price}
                onChange={(e) => setNewTier({ ...newTier, min_price: parseFloat(e.target.value) })}
                placeholder="0.00"
                className="input-field w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Max Price (€)</label>
              <input
                type="number"
                step="0.01"
                value={newTier.max_price}
                onChange={(e) => setNewTier({ ...newTier, max_price: parseFloat(e.target.value) })}
                placeholder="2.99"
                className="input-field w-full"
              />
            </div>
          </div>
          <button onClick={handleCreateTier} className="btn-primary">
            Create Pricing Tier
          </button>
        </div>

        {/* Edit Modal */}
        {editingTier && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-2xl w-full">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Edit Pricing Tier</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-semibold mb-2">Tier Name</label>
                  <input
                    type="text"
                    value={editingTier.name}
                    onChange={(e) => setEditingTier({ ...editingTier, name: e.target.value })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Buy Percentage (%)</label>
                  <input
                    type="number"
                    value={editingTier.percentage}
                    onChange={(e) => setEditingTier({ ...editingTier, percentage: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Min Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTier.min_price}
                    onChange={(e) => setEditingTier({ ...editingTier, min_price: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-2">Max Price (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingTier.max_price}
                    onChange={(e) => setEditingTier({ ...editingTier, max_price: parseFloat(e.target.value) })}
                    className="input-field w-full"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateTier} className="btn-primary flex-1">
                  Save Changes
                </button>
                <button onClick={() => setEditingTier(null)} className="btn-outline flex-1">
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