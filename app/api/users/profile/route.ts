import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  console.log('📊 Profile API called')
  
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    if (!user) {
      console.error('No user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('User:', user.email)

    // Try to get existing profile first
    let { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    // If profile doesn't exist, try to create it
    if (!profile && !profileError) {
      console.log('User profile not found, creating...')
      
      const { data: newProfile, error: createError } = await supabase
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.user_metadata?.full_name || null,
          role: 'customer',
          total_submissions: 0,
          total_cards_sold: 0,
          total_value_earned: 0
        })
        .select()
        .single()

      // Handle race condition - if duplicate key, fetch the existing profile
      if (createError && createError.code === '23505') {
        console.log('Race condition detected, fetching existing profile...')
        const { data: existingProfile, error: fetchError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        if (fetchError) {
          console.error('Error fetching after race condition:', fetchError)
          return NextResponse.json({ 
            error: 'Failed to fetch profile',
            details: fetchError.message 
          }, { status: 500 })
        }

        profile = existingProfile
      } else if (createError) {
        console.error('Error creating profile:', createError)
        return NextResponse.json({ 
          error: 'Failed to create profile',
          details: createError.message 
        }, { status: 500 })
      } else {
        console.log('✅ Profile created:', newProfile?.email)
        profile = newProfile
      }
    } else if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json({ 
        error: 'Failed to fetch profile',
        details: profileError.message 
      }, { status: 500 })
    }

    if (!profile) {
      console.error('Profile still null after all attempts')
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    console.log('✅ Profile loaded:', profile.email)
    return NextResponse.json({ success: true, profile })
    
  } catch (error: any) {
    console.error('❌ Profile API error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error.toString()
    }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  console.log('✏️ Profile update called')
  
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name } = body

    console.log('Updating name to:', name)

    const { data: profile, error: updateError } = await supabase
      .from('users')
      .update({ 
        name,
        last_active_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating profile:', updateError)
      return NextResponse.json({ 
        error: 'Failed to update profile',
        details: updateError.message 
      }, { status: 500 })
    }

    console.log('✅ Profile updated')
    return NextResponse.json({ success: true, profile })
    
  } catch (error: any) {
    console.error('❌ Profile update error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}