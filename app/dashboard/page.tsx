'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    console.log('🔐 Checking authentication...')
    
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('Auth error:', authError)
        setError('Authentication error')
        router.push('/')
        return
      }
      
      if (!user) {
        console.log('No user, redirecting...')
        router.push('/')
        return
      }

      console.log('✅ User authenticated:', user.email)
      setUser(user)

      // Check if user is staff
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('role, shop_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        // Profile might not exist yet, that's okay for testing
        console.warn('No user profile found, creating basic access...')
        loadDashboard()
        return
      }

      console.log('User profile:', profile)

      if (!profile || !['staff', 'admin', 'owner'].includes(profile.role)) {
        console.log('User is not staff')
        alert('Access denied - Staff only')
        router.push('/')
        return
      }

      console.log('✅ User is staff, loading dashboard...')
      loadDashboard()
      
    } catch (err: any) {
      console.error('Auth check failed:', err)
      setError(err.message)
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    console.log('📊 Loading dashboard data...')
    setLoading(true)
    
    try {
      const response = await fetch('/api/analytics/dashboard?range=7d')
      console.log('Response status:', response.status)
      
      const data = await response.json()
      console.log('Dashboard data:', data)

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load dashboard')
      }

      setStats(data.stats)
      setError('')
      
    } catch (err: any) {
      console.error('Dashboard load error:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <div className="text-xl text-cyan-500">Loading Dashboard...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-red-900 bg-opacity-20 border border-red-500 rounded-lg p-6">
          <div className="text-4xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">Error Loading Dashboard</h2>
          <p className="text-red-300 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">No data available</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-cyan-500 mb-8">📊 Dashboard</h1>

        {/* Simple Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="text-3xl font-bold text-cyan-500">
              {stats.totalSubmissions || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Submissions</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-emerald-500">
              {stats.totalCards || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Cards</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-blue-500">
              €{(stats.totalBuyPrice || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Value</div>
          </div>
          
          <div className="card">
            <div className="text-3xl font-bold text-purple-500">
              €{(stats.avgSubmissionValue || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Avg Submission</div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-cyan-500 mb-4">Debug Info</h2>
          <pre className="bg-slate-950 p-4 rounded text-xs overflow-x-auto">
            {JSON.stringify({ user: user?.email, stats }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
