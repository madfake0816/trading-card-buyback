'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'

export default function AuthButton({ inline = false }: { inline?: boolean }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    const fetchSession = async () => {
      // Keine Destructuring-Bindung mit impliziten any
      const { data: sessionData } = await supabase.auth.getSession()
      const session: Session | null = sessionData.session
      setUser(session?.user ?? null)
      setLoading(false)
    }

    fetchSession()

    // Explizite Typen für event + session
    const authListener = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
      }
    )

    // Kein verschachteltes Destructuring, so bleibt's typsicher
    return () => {
      authListener.data.subscription.unsubscribe()
    }
  }, [supabase])

  const handleSignIn = async () => {
    const currentPath = window.location.pathname

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${currentPath}`,
      },
    })

    if (error) {
      console.error('Sign in error:', error)
      alert('Sign in failed. Please try again.')
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  if (loading) {
    return <div className="text-sm text-gray-400">Loading...</div>
  }

  if (user) {
    if (inline) {
      return (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">✓ Signed in as {user.email}</span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-3">
        <div className="text-sm">
          <div className="text-gray-400">Signed in as</div>
          <div className="font-semibold text-cyan-400">{user.email}</div>
        </div>
        <button
          onClick={handleSignOut}
          className="text-sm text-red-400 hover:text-red-300 transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  if (inline) {
    return (
      <button
        onClick={handleSignIn}
        className="text-sm text-cyan-400 hover:text-cyan-300 underline"
      >
        Sign in to submit
      </button>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="btn-primary text-sm px-4 py-2"
    >
      🔐 Sign In with Google
    </button>
  )
}
