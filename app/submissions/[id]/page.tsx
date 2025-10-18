'use client'

import { useState, useEffect, use } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import SafeImage from '@/components/SafeImage'

interface SubmissionCard {
  id: string
  card_name: string
  set_code: string
  set_name: string
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
  submission_cards: SubmissionCard[]
}

export default function SubmissionDetailPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = use(params)
  const [submission, setSubmission] = useState<Submission | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadSubmission()
  }, [resolvedParams.id])

  const loadSubmission = async () => {
    setLoading(true)
    
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const response = await fetch(`/api/submissions/${resolvedParams.id}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load submission')
      }

      setSubmission(data.submission)
    } catch (error: any) {
      console.error('Error:', error)
      alert(`Error: ${error.message}`)
      router.push('/submissions')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'badge-pending',
      accepted: 'badge-accepted',
      rejected: 'badge-rejected',
      paid: 'badge-paid'
    }
    return colors[status] || 'bg-gray-600'
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
        <div className="text-xl text-gray-400">Not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/submissions" className="text-cyan-500 hover:text-cyan-400 mb-6 inline-block">
          ← Back to Submissions
        </Link>

        <div className="card p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-cyan-500 mb-2">
                {submission.submission_number}
              </h1>
              <p className="text-gray-400">
                {new Date(submission.created_at).toLocaleDateString()} at{' '}
                {new Date(submission.created_at).toLocaleTimeString()}
              </p>
            </div>
            <span className={`badge ${
  submission.status === 'pending' ? 'badge-pending' :
  submission.status === 'accepted' ? 'badge-accepted' :
  submission.status === 'rejected' ? 'badge-rejected' :
  submission.status === 'paid' ? 'badge-paid' :
  'bg-gray-600 text-white'
}`}>
              {submission.status.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Cards</div>
              <div className="text-2xl font-bold text-cyan-500">{submission.total_cards}</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Market</div>
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
            <div className="bg-slate-800 p-4 rounded-lg">
              <div className="text-sm text-gray-400">Payment</div>
              <div className="text-lg font-semibold capitalize">
                {submission.payment_method?.replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-6">
            Cards ({submission.submission_cards?.length || 0})
          </h2>
          
          <div className="space-y-3">
            {submission.submission_cards?.map((card) => (
              <div key={card.id} className="bg-slate-800 p-4 rounded-lg flex flex-col sm:flex-row gap-4">
                {card.image_url && (
                  <div className="flex-shrink-0">
                    <SafeImage
                      src={card.image_url}
                      alt={card.card_name}
                      className="rounded"
                      style={{ width: '100px', height: 'auto' }}
                      unoptimized
                    />
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-bold text-lg">{card.card_name}</div>
                  <div className="text-sm text-gray-400">
                    {card.set_name} ({card.set_code.toUpperCase()})
                  </div>
                  <div className="text-sm mt-2 text-gray-400">
                    {card.condition} • {card.language.toUpperCase()} • Qty: {card.quantity}
                    {card.foil && ' • Foil ✨'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Buy Price</div>
                  <div className="text-xl font-bold text-emerald-500">
                    €{(parseFloat(card.buy_price.toString()) * card.quantity).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-700 flex justify-between text-xl font-bold">
            <span>Total:</span>
            <span className="text-emerald-500">
              €{parseFloat(submission.total_buy_price.toString()).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}