'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserProfile {
  id: string
  email: string
  name: string | null
  total_submissions: number
  total_cards_sold: number
  total_value_earned: number
  created_at: string
  last_active_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const router = useRouter()
  const supabase = createClient()
  const loadingRef = useRef(false) // Prevent double loading

  useEffect(() => {
    // Only load once
    if (!loadingRef.current) {
      loadingRef.current = true
      loadProfile()
    }
  }, [])

  const loadProfile = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/')
        return
      }

      const response = await fetch('/api/users/profile')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load profile')
      }

      setProfile(data.profile)
      setName(data.profile.name || '')
    } catch (error: any) {
      console.error('Profile error:', error)
      alert(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async () => {
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile')
      }

      setProfile(data.profile)
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error: any) {
      console.error('Update error:', error)
      alert(`Error: ${error.message}`)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-cyan-500">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-cyan-500 mb-2">My Profile</h1>
          <p className="text-gray-400">Manage your account and view your statistics</p>
        </div>

        {/* Profile Card */}
        <div className="card p-6 mb-6">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-cyan-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                {profile.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {profile.name || 'No name set'}
                </h2>
                <p className="text-gray-400">{profile.email}</p>
                <p className="text-xs text-gray-500 mt-1">
                  Member since {new Date(profile.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditing(!editing)}
              className="btn-outline text-sm px-4 py-2"
            >
              {editing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="bg-slate-800 p-4 rounded-lg mb-6">
              <label className="block text-sm font-semibold mb-2">Display Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="input-field flex-1"
                />
                <button onClick={handleUpdateProfile} className="btn-primary">
                  Save
                </button>
              </div>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-cyan-500">
                {profile.total_submissions}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Submissions</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-emerald-500">
                {profile.total_cards_sold}
              </div>
              <div className="text-sm text-gray-400 mt-1">Cards Sold</div>
            </div>
            <div className="bg-slate-800 p-4 rounded-lg text-center">
              <div className="text-3xl font-bold text-blue-500">
                €{parseFloat(profile.total_value_earned.toString()).toFixed(2)}
              </div>
              <div className="text-sm text-gray-400 mt-1">Total Earned</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <Link href="/submissions" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-3">📋</div>
            <h3 className="text-xl font-bold text-white mb-2">My Submissions</h3>
            <p className="text-sm text-gray-400">
              View and track all your card submissions
            </p>
          </Link>

          <Link href="/mtg" className="card p-6 hover:border-cyan-500 transition-colors">
            <div className="text-4xl mb-3">🔍</div>
            <h3 className="text-xl font-bold text-white mb-2">Browse Cards</h3>
            <p className="text-sm text-gray-400">
              Search for cards and create new submissions
            </p>
          </Link>
        </div>

        {/* Account Actions */}
        <div className="card p-6">
          <h3 className="text-xl font-bold text-white mb-4">Account Actions</h3>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="w-full text-left px-4 py-3 bg-red-900 bg-opacity-20 border border-red-500 rounded-lg hover:bg-opacity-30 transition-colors text-red-400"
            >
              🚪 Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}