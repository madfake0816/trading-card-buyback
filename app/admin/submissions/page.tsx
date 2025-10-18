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
  total_market_value: number
  total_buy_price: number
  payment_method: string
  created_at: string
  users: {
    name: string
    email: string
  }
}

export default function AdminSubmissions() {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [filter, setFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadSubmissions()
    }
  }, [filter, loading])

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
      router.push('/')
      return
    }

    setLoading(false)
  }

  const loadSubmissions = async () => {
    try {
      let query = supabase
        .from('submissions')
      .select(`
  *,
  users!submissions_user_id_fkey (
    name,
    email
  )
`)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error

      setSubmissions(data || [])
    } catch (error) {
      console.error('Error loading submissions:', error)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('submissions')
        .update({ status: newStatus })
        .eq('id', id)

      if (error) throw error

      alert(`Status updated to ${newStatus}`)
      loadSubmissions()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600'
      case 'accepted': return 'bg-green-600'
      case 'rejected': return 'bg-red-600'
      case 'paid': return 'bg-blue-600'
      default: return 'bg-gray-600'
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-cyan-500">Review Submissions</h1>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {['all', 'pending', 'accepted', 'rejected', 'paid'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                filter === status
                  ? 'bg-cyan-500 text-white'
                  : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status === 'pending' && submissions.filter(s => s.status === 'pending').length > 0 && (
                <span className="ml-2 bg-yellow-500 text-black px-2 py-0.5 rounded-full text-xs">
                  {submissions.filter(s => s.status === 'pending').length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Submissions List */}
        {submissions.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h2 className="text-xl font-semibold mb-2">No submissions found</h2>
            <p className="text-gray-400">No submissions match the current filter.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div key={submission.id} className="card p-6">
                <div className="flex flex-col lg:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-cyan-500">
                        {submission.submission_number}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-white text-sm font-semibold ${getStatusColor(submission.status)}`}>
                        {submission.status.toUpperCase()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Customer:</span>{' '}
                        <span className="font-semibold">{submission.users?.name || 'Unknown'}</span>
                        <div className="text-xs text-gray-500">{submission.users?.email}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Cards:</span>{' '}
                        <span className="font-semibold">{submission.total_cards}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Buy Price:</span>{' '}
                        <span className="font-semibold text-emerald-500">
                          €{parseFloat(submission.total_buy_price.toString()).toFixed(2)}
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

                  <div className="flex flex-col gap-2">
                    <Link
                      href={`/admin/submissions/${submission.id}`}
                      className="btn-primary text-center"
                    >
                      View Details
                    </Link>
                    
                    {submission.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => updateStatus(submission.id, 'accepted')}
                          className="btn-outline flex-1 text-green-500 border-green-500 hover:bg-green-500 hover:text-white"
                        >
                          ✓ Accept
                        </button>
                        <button
                          onClick={() => updateStatus(submission.id, 'rejected')}
                          className="btn-outline flex-1 text-red-500 border-red-500 hover:bg-red-500 hover:text-white"
                        >
                          ✗ Reject
                        </button>
                      </div>
                    )}

                    {submission.status === 'accepted' && (
                      <button
                        onClick={() => updateStatus(submission.id, 'paid')}
                        className="btn-outline text-blue-500 border-blue-500 hover:bg-blue-500 hover:text-white"
                      >
                        💰 Mark as Paid
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}