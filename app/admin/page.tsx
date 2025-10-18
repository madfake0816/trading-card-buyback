'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [userRole, setUserRole] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push('/auth/signin')
        return
      }

      setUser(user)

      // Check user role
      const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
        alert('Access denied - Admin only')
        router.push('/')
        return
      }

      setUserRole(profile.role)
      loadDashboard()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/auth/signin')
    } finally {
      setLoading(false)
    }
  }

  const loadDashboard = async () => {
    try {
      const response = await fetch('/api/analytics/dashboard?range=30d')
      const data = await response.json()
      
      if (data.success) {
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error)
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
          <h1 className="text-4xl font-bold text-cyan-500 mb-2">
            Admin Dashboard
          </h1>
          <p className="text-gray-400">
            Welcome back, {user?.email} ({userRole})
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl font-bold text-cyan-500">
              {stats?.totalSubmissions || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Submissions</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-emerald-500">
              {stats?.totalCards || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Cards</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-blue-500">
              €{(stats?.totalBuyPrice || 0).toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Value</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-purple-500">
              {stats?.pendingCount || 0}
            </div>
            <div className="text-sm text-gray-400 mt-2">Pending Review</div>
          </div>
        </div>

        {/* Admin Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/admin/submissions" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">Review Submissions</h3>
            <p className="text-sm text-gray-400">
              Accept, reject, or modify customer submissions
            </p>
          </Link>

          <Link href="/admin/users" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">👥</div>
            <h3 className="text-xl font-bold text-white mb-2">Manage Users</h3>
            <p className="text-sm text-gray-400">
              View and manage user accounts and roles
            </p>
          </Link>

          <Link href="/admin/pricing" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-white mb-2">Pricing Rules</h3>
            <p className="text-sm text-gray-400">
              Configure buylist pricing tiers
            </p>
          </Link>

          <Link href="/admin/analytics" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">📊</div>
            <h3 className="text-xl font-bold text-white mb-2">Analytics</h3>
            <p className="text-sm text-gray-400">
              Detailed reports and insights
            </p>
          </Link>

          <Link href="/admin/settings" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">⚙️</div>
            <h3 className="text-xl font-bold text-white mb-2">Shop Settings</h3>
            <p className="text-sm text-gray-400">
              Configure shop name, logo, and preferences
            </p>
          </Link>

          <Link href="/admin/inventory" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-white mb-2">Inventory</h3>
            <p className="text-sm text-gray-400">
              Track purchased cards and stock levels
            </p>
          </Link>

          <Link href="/admin/featured" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-4">👀</div>
            <h3 className="text-xl font-bold text-white mb-2">Wanted List</h3>
            <p className="text-sm text-gray-400">
              Add Cards to the Featured-List
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}