import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  console.log('📄 Submission detail API called')
  
  try {
    const { id } = await context.params
    const supabase = await createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Fetching submission:', id)

    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select(`
        *,
        submission_cards (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (submissionError) {
      console.error('Error:', submissionError)
      return NextResponse.json({ 
        error: 'Submission not found',
        details: submissionError.message 
      }, { status: 404 })
    }

    console.log('Submission loaded:', submission.submission_number)
    
    return NextResponse.json({ success: true, submission })
    
  } catch (error: any) {
    console.error('Error:', error)
    return NextResponse.json({ 
      error: 'Internal error',
      details: error.message
    }, { status: 500 })
  }
}