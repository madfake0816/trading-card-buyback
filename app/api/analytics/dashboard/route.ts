import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Get date range from query parameter
    const searchParams = request.nextUrl.searchParams
    const range = searchParams.get('range') || '30d'
    
    // Calculate date based on range
    const daysAgo = parseInt(range.replace('d', ''))
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get total submissions
    const { count: totalSubmissions } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', startDate.toISOString())

    // Get total cards
    const { data: submissions } = await supabase
      .from('submissions')
      .select('total_cards, total_buy_price, status')
      .gte('created_at', startDate.toISOString())

    const totalCards = submissions?.reduce((sum, s) => sum + s.total_cards, 0) || 0
    const totalBuyPrice = submissions?.reduce((sum, s) => sum + parseFloat(s.total_buy_price.toString()), 0) || 0
    const pendingCount = submissions?.filter(s => s.status === 'pending').length || 0

    // Get recent submissions
    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select(`
        id,
        submission_number,
        status,
        total_cards,
        total_buy_price,
        created_at,
        users!submissions_user_id_fkey (
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      success: true,
      stats: {
        totalSubmissions: totalSubmissions || 0,
        totalCards,
        totalBuyPrice,
        pendingCount,
        recentSubmissions: recentSubmissions || [],
      }
    })

  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}