'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'

interface SubmissionCard {
  id: string
  card_name: string
  set_name: string
  set_code: string
  condition: string
  language: string
  foil: boolean
  quantity: number
  market_price: number
  buy_price: number
  image_url: string
}

interface Submission {
  id: string
  submission_number: string
  status: string
  total_cards: number
  total_market_value: number
  total_buy_price: number
  payment_method: string
  created_at: string
  notes: string
  users: {
    id: string
    name: string
    email: string
    phone: string
  }
  submission_cards: SubmissionCard[]
}

export default function AdminSubmissionDetail({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const [newStatus, setNewStatus] = useState('')
  const [adjustedPrice, setAdjustedPrice] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuthAndLoad()
  }, [resolvedParams.id])

  const checkAuthAndLoad = async () => {
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
      
      router.push('/')
      return
    }

    loadSubmission()
  }

  const loadSubmission = async () => {
    try {
      const { data, error } = await supabase
        .from('submissions')
       .select(`
  *,
  users!submissions_user_id_fkey (
    id,
    name,
    email,
    phone
  ),
  submission_cards (*)
`)
        .eq('id', resolvedParams.id)
        .single()

      if (error) throw error

      setSubmission(data)
      setNewStatus(data.status)
      setAdjustedPrice(data.total_buy_price.toString())
    } catch (error) {
      console.error('Error:', error)
      alert('Failed to load submission')
      router.push('/admin/submissions')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!submission) return

    try {
      const { error } = await supabase
        .from('submissions')
        .update({
          status: newStatus,
          total_buy_price: parseFloat(adjustedPrice)
        })
        .eq('id', submission.id)

      if (error) throw error

      alert('Submission updated successfully!')
      loadSubmission()
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

  if (!submission) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">Submission not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <Link href="/admin/submissions" className="text-cyan-500 hover:text-cyan-400 mb-6 inline-block">
          ← Back to Submissions
        </Link>

        {/* Header */}
        <div className="card p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-3xl font-bold text-cyan-500 mb-2">
                {submission.submission_number}
              </h1>
              <p className="text-gray-400">
                {new Date(submission.created_at).toLocaleString()}
              </p>
            </div>
            <span className={`px-4 py-2 rounded-lg text-white font-semibold ${
              submission.status === 'pending' ? 'bg-yellow-600' :
              submission.status === 'accepted' ? 'bg-green-600' :
              submission.status === 'rejected' ? 'bg-red-600' :
              submission.status === 'paid' ? 'bg-blue-600' : 'bg-gray-600'
            }`}>
              {submission.status.toUpperCase()}
            </span>
          </div>

          {/* Customer Info */}
          <div className="bg-slate-800 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-bold mb-3">Customer Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Name:</span>{' '}
                <span className="font-semibold">{submission.users.name}</span>
              </div>
              <div>
                <span className="text-gray-400">Email:</span>{' '}
                <span className="font-semibold">{submission.users.email}</span>
              </div>
              {submission.users.phone && (
                <div>
                  <span className="text-gray-400">Phone:</span>{' '}
                  <span className="font-semibold">{submission.users.phone}</span>
                </div>
              )}
              <div>
                <span className="text-gray-400">Payment Method:</span>{' '}
                <span className="font-semibold capitalize">{submission.payment_method?.replace('_', ' ')}</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Total Cards</div>
              <div className="text-2xl font-bold text-cyan-500">{submission.total_cards}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Market Value</div>
              <div className="text-2xl font-bold text-blue-500">
                €{parseFloat(submission.total_market_value.toString()).toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Buy Price</div>
              <div className="text-2xl font-bold text-emerald-500">
                €{parseFloat(submission.total_buy_price.toString()).toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="card p-6 mb-6">
          <h3 className="text-xl font-bold text-cyan-500 mb-4">Admin Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">Status</label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="input-field w-full"
              >
                <option value="pending">Pending</option>
                <option value="accepted">Accepted</option>
                <option value="rejected">Rejected</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Adjusted Buy Price (€)</label>
              <input
                type="number"
                step="0.01"
                value={adjustedPrice}
                onChange={(e) => setAdjustedPrice(e.target.value)}
                className="input-field w-full"
              />
            </div>
          </div>
          <button onClick={handleUpdateStatus} className="btn-primary mt-4">
            Save Changes
          </button>
        </div>

        {/* Cards List */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-6">
            Cards ({submission.submission_cards?.length || 0})
          </h2>
          
          <div className="space-y-3">
            {submission.submission_cards?.map((card) => (
              <div key={card.id} className="bg-slate-800 p-4 rounded-lg flex gap-4">
                {card.image_url && (
                  <SafeImage
                    src={card.image_url}
                    alt={card.card_name}
                    className="rounded"
                    style={{ width: '100px', height: 'auto' }}
                    unoptimized
                  />
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg">{card.card_name}</div>
                  <div className="text-sm text-gray-400">
                    {card.set_name} ({card.set_code.toUpperCase()})
                  </div>
                  <div className="text-sm mt-2">
                    {card.condition} • {card.language.toUpperCase()} • Qty: {card.quantity}
                    {card.foil && ' • Foil ✨'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Buy Price</div>
                  <div className="text-xl font-bold text-emerald-500">
                    €{(parseFloat(card.buy_price.toString()) * card.quantity).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-500">
                    €{parseFloat(card.buy_price.toString()).toFixed(2)} each
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}