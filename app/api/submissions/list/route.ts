import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  console.log('📋 Submissions list API called')
  
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching submissions for:', user.email)

    const { data: submissions, error: submissionsError } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (submissionsError) {
      console.error('Error:', submissionsError)
      return NextResponse.json({ 
        error: 'Database error',
        details: submissionsError.message 
      }, { status: 500 })
    }

    console.log('Found submissions:', submissions?.length || 0)
    
    return NextResponse.json({ 
      success: true, 
      submissions: submissions || [] 
    })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      details: error.message
    }, { status: 500 })
  }
}
