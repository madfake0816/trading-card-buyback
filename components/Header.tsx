'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User, Session, AuthChangeEvent } from '@supabase/supabase-js'
import LanguageToggle from './LanguageToggle'

export default function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [showDropdown, setShowDropdown] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getSession()
      const session: Session | null = data.session
      setUser(session?.user ?? null)

      if (session?.user) {
        await loadUserProfile(session.user.id)
      }

      setLoading(false)
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          loadUserProfile(session.user.id)
        } else {
          setUserName('')
          setIsAdmin(false)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  const loadUserProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('users')
        .select('name, role')
        .eq('id', userId)
        .single()

      if (error) throw error

      if (profile?.name) {
        setUserName(profile.name)
      } else {
        const email = user?.email || ''
        setUserName(email.split('@')[0])
      }

      if (profile?.role && ['admin', 'owner', 'staff'].includes(profile.role)) {
        setIsAdmin(true)
      } else {
        setIsAdmin(false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
      const email = user?.email || ''
      setUserName(email.split('@')[0])
      setIsAdmin(false)
    }
  }

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
    setShowDropdown(false)
    window.location.href = '/'
  }

  return (
    <header className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link
            href="/"
            className="text-2xl font-bold text-cyan-500 hover:text-cyan-400 transition-colors"
          >
            CardFlow
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/mtg"
              className="text-gray-300 hover:text-cyan-400 transition-colors"
            >
              Browse Cards
            </Link>
            {user && (
              <Link
                href="/submissions"
                className="text-gray-300 hover:text-cyan-400 transition-colors"
              >
                My Submissions
              </Link>
            )}
          </nav>

          {/* Right Side: Language & Auth */}
          <div className="flex items-center gap-4">
            <LanguageToggle />

            {loading ? (
              <div className="text-sm text-gray-400">...</div>
            ) : user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-white font-bold">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block text-left">
                    <div className="text-xs text-gray-400">Signed in as</div>
                    <div className="text-sm font-semibold text-white truncate max-w-[150px]">
                      {userName}
                    </div>
                  </div>
                  <svg
                    className={`w-4 h-4 transition-transform ${
                      showDropdown ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-lg py-2 z-50">
                    {isAdmin && (
                      <>
                        <Link
                          href="/admin"
                          className="block px-4 py-2 text-sm text-cyan-400 hover:bg-slate-700 transition-colors font-semibold"
                          onClick={() => setShowDropdown(false)}
                        >
                          ⚡ Admin Dashboard
                        </Link>
                        <hr className="my-2 border-slate-700" />
                      </>
                    )}

                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      👤 Profile
                    </Link>
                    <Link
                      href="/submissions"
                      className="block px-4 py-2 text-sm text-gray-300 hover:bg-slate-700 transition-colors"
                      onClick={() => setShowDropdown(false)}
                    >
                      📋 My Submissions
                    </Link>
                    <hr className="my-2 border-slate-700" />
                    <button
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/signin"
                  className="btn-outline text-sm px-4 py-2"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="btn-primary text-sm px-4 py-2"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex gap-4 mt-3 pt-3 border-t border-slate-700">
         
          <Link
            href="/mtg"
            className="text-sm text-gray-300 hover:text-cyan-400 transition-colors"
          >
            Browse
          </Link>
          {user && (
            <Link
              href="/submissions"
              className="text-sm text-gray-300 hover:text-cyan-400 transition-colors"
            >
              Submissions
            </Link>
          )}
        </nav>
      </div>
    </header>
  )
}
