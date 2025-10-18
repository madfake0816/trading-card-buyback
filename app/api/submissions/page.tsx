'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Submission {
  id: string
  submission_number: string
  status: string
  total_cards: number
  total_buy_price: number
  payment_method: string
  created_at: string
  notes: string
}

export default function MySubmissionsPage() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'badge-pending'
      case 'accepted': return 'badge-accepted'
      case 'rejected': return 'badge-rejected'
      case 'paid': return 'badge-paid'
      default: return 'bg-gray-600 text-white'
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/')
      return
    }

    setUser(user)
    loadSubmissions()
  }

  const loadSubmissions = async () => {
    setLoading(true)
    
    try {
      const response = await fetch('/api/submissions/list')
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to load submissions')
      }

      const data = await response.json()
      setSubmissions(data.submissions || [])
      
    } catch (error: any) {
      console.error('Load error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
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
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-cyan-500 mb-2">My Submissions</h1>
          <p className="text-gray-400">Track all your card buylist submissions</p>
        </div>

        {submissions.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-4">
              <div className="text-2xl font-bold text-cyan-500">
                {submissions.length}
              </div>
              <div className="text-sm text-gray-400">Total Submissions</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-emerald-500">
                {submissions.reduce((sum, s) => sum + s.total_cards, 0)}
              </div>
              <div className="text-sm text-gray-400">Total Cards</div>
            </div>
            <div className="card p-4">
              <div className="text-2xl font-bold text-blue-500">
                €{submissions.reduce((sum, s) => sum + parseFloat(s.total_buy_price.toString()), 0).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400">Total Value</div>
            </div>
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h2 className="text-xl font-semibold mb-2">No submissions yet</h2>
            <p className="text-gray-400 mb-6">Start by adding cards to your sell list</p>
            <Link href="/mtg" className="btn-primary inline-block">
              Browse Cards
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="card p-6 hover:border-cyan-500 cursor-pointer transition-all"
                onClick={() => router.push(`/submissions/${submission.id}`)}
              >
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-lg font-bold text-cyan-500">
                        {submission.submission_number}
                      </span>
                      <span className={`badge ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Cards:</span>{' '}
                        <span className="font-semibold">{submission.total_cards}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Value:</span>{' '}
                        <span className="font-semibold text-emerald-500">
                          €{parseFloat(submission.total_buy_price.toString()).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Payment:</span>{' '}
                        <span className="font-semibold capitalize">
                          {submission.payment_method?.replace('_', ' ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-400">Date:</span>{' '}
                        <span className="font-semibold">
                          {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button className="btn-outline text-sm px-4 py-2">
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}