import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/mtg'

  console.log('🔐 Auth callback triggered')
  console.log('Code:', code ? 'Present' : 'Missing')
  console.log('Next:', next)

  if (code) {
    try {
      const supabase = await createClient()
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('❌ Auth callback error:', error)
        return NextResponse.redirect(new URL(`/?error=${encodeURIComponent(error.message)}`, requestUrl.origin))
      }

      console.log('✅ Session created for:', data.user?.email)
    } catch (err) {
      console.error('❌ Exception in auth callback:', err)
      return NextResponse.redirect(new URL('/?error=auth_exception', requestUrl.origin))
    }
  }

  // Redirect to where they were, or /mtg by default
  return NextResponse.redirect(new URL(next, requestUrl.origin))
}