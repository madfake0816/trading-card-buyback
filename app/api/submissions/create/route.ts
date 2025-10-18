import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🚀 Submission API called')
  
  try {
    const supabase = await createClient()
    console.log('✅ Supabase client created')
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('👤 User check:', user ? `User: ${user.email}` : 'No user')
    
    if (authError) {
      console.error('❌ Auth error:', authError)
      return NextResponse.json({ error: 'Authentication error' }, { status: 401 })
    }
    
    if (!user) {
      console.error('❌ No user found')
      return NextResponse.json({ error: 'Unauthorized - Please sign in' }, { status: 401 })
    }
    
    const body = await request.json()
    console.log('📦 Request body received')
    
    const { cards, paymentMethod, shopId, notes } = body
    
    // Validate input
    if (!cards || !Array.isArray(cards) || cards.length === 0) {
      console.error('❌ No cards provided')
      return NextResponse.json({ error: 'No cards provided' }, { status: 400 })
    }
    
    console.log(`📊 Processing ${cards.length} cards`)
    
    // Calculate totals
    const totalCards = cards.reduce((sum: number, card: any) => sum + (card.quantity || 1), 0)
    const totalMarketValue = cards.reduce((sum: number, card: any) => 
      sum + ((card.marketPrice || 0) * (card.quantity || 1)), 0
    )
    const totalBuyPrice = cards.reduce((sum: number, card: any) => 
      sum + ((card.buyPrice || 0) * (card.quantity || 1)), 0
    )
    
    console.log('💰 Totals calculated:', {
      totalCards,
      totalMarketValue,
      totalBuyPrice
    })
    
    // Use shop ID from request or env
    const finalShopId = shopId || process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID
    console.log('🏪 Shop ID:', finalShopId)
    
    if (!finalShopId) {
      console.error('❌ No shop ID')
      return NextResponse.json({ error: 'Shop ID not configured' }, { status: 500 })
    }
    
    // Create submission
    console.log('📝 Creating submission in database...')
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        shop_id: finalShopId,
        user_id: user.id,
        total_cards: totalCards,
        total_market_value: totalMarketValue,
        total_buy_price: totalBuyPrice,
        payment_method: paymentMethod || 'cash',
        status: 'pending',
        notes: notes || null
      })
      .select()
      .single()
    
    if (submissionError) {
      console.error('❌ Submission creation error:', submissionError)
      return NextResponse.json({ 
        error: `Database error: ${submissionError.message}`,
        details: submissionError 
      }, { status: 500 })
    }
    
    console.log('✅ Submission created:', submission.id)
    
    // Insert all cards
    console.log('📇 Inserting cards...')
    const cardsWithSubmissionId = cards.map((card: any) => ({
      submission_id: submission.id,
      card_name: card.cardName,
      set_code: card.setCode,
      set_name: card.setName,
      collector_number: card.collectorNumber || '',
      condition: card.condition || 'NM',
      language: card.language || 'en',
      foil: card.foil || false,
      quantity: card.quantity || 1,
      market_price: card.marketPrice || 0,
      buy_price: card.buyPrice || 0,
      image_url: card.imageUrl || null,
      tcg: card.tcg || 'Magic: The Gathering'
    }))
    
    console.log('📇 Cards to insert:', cardsWithSubmissionId.length)
    
    const { error: cardsError } = await supabase
      .from('submission_cards')
      .insert(cardsWithSubmissionId)
    
    if (cardsError) {
      console.error('❌ Cards insert error:', cardsError)
      // Try to delete the submission since cards failed
      await supabase.from('submissions').delete().eq('id', submission.id)
      
      return NextResponse.json({ 
        error: `Failed to save cards: ${cardsError.message}`,
        details: cardsError 
      }, { status: 500 })
    }
    
    console.log('✅ Cards inserted successfully')
    
    // Update user stats (don't fail if this fails)
    console.log('👤 Updating user stats...')
    try {
      const { error: statsError } = await supabase.rpc('increment_user_stats', {
        p_user_id: user.id,
        p_cards: totalCards,
        p_value: totalBuyPrice
      })
      
      if (statsError) {
        console.warn('⚠️ Stats update warning:', statsError.message)
      }
    } catch (statsErr) {
      console.warn('⚠️ Stats update failed (non-critical):', statsErr)
    }
    
    console.log('✅ Submission complete!')
    
    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        submission_number: submission.submission_number,
        total_cards: submission.total_cards,
        total_buy_price: submission.total_buy_price
      }
    })
    
  } catch (error: any) {
    console.error('💥 FATAL ERROR:', error)
    console.error('Stack:', error.stack)
    
    return NextResponse.json(
      { 
        error: error.message || 'Failed to create submission',
        details: error.toString()
      },
      { status: 500 }
    )
  }
}