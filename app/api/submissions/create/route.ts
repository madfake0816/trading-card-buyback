import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { cards, payment_method, notes } = body

    if (!cards || cards.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No cards provided' },
        { status: 400 }
      )
    }

    // Get shop_id with detailed logging
// Get shop_id with detailed logging
console.log('Attempting to fetch shop_settings...')
const { data: shopSettings, error: shopError } = await supabase
  .from('shop_settings')
  .select('id, shop_name')
  .limit(1)
  .maybeSingle()

console.log('Shop fetch result:', {
  hasData: !!shopSettings,
  shopId: shopSettings?.id,
  shopName: shopSettings?.shop_name,
  error: shopError
})

if (shopError) {
  console.error('Shop fetch error:', shopError)
  return NextResponse.json(
    { 
      success: false, 
      error: 'Failed to fetch shop settings',
      details: shopError.message 
    },
    { status: 500 }
  )
}

// Declare shopId variable
let shopId: string

if (!shopSettings || !shopSettings.id) {
  console.error('No shop found or missing ID')
  
  // Try to create default shop
  console.log('Attempting to create default shop...')
  const { data: newShop, error: createError } = await supabase
    .from('shop_settings')
    .insert([{ shop_name: 'CardFlow' }])
    .select('id')
    .single()

  if (createError || !newShop || !newShop.id) {
    console.error('Failed to create shop:', createError)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Shop not configured and could not create default',
        details: createError?.message 
      },
      { status: 500 }
    )
  }

  console.log('Created new shop:', newShop.id)
  shopId = newShop.id
} else {
  shopId = shopSettings.id
}

// Now shopId is guaranteed to be a string
console.log('Using shop_id:', shopId)

// Calculate totals
const totalCards = cards.reduce((sum: number, card: any) => sum + card.quantity, 0)
    const totalMarketValue = cards.reduce(
      (sum: number, card: any) => sum + (card.marketPrice * card.quantity),
      0
    )
    const totalBuyPrice = cards.reduce(
      (sum: number, card: any) => sum + (card.buyPrice * card.quantity),
      0
    )

    // Generate submission number
    const submissionNumber = `SUB-${Date.now()}`

    console.log('Creating submission with shop_id:', shopId)

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert([{
        user_id: user.id,
        shop_id: shopId,
        submission_number: submissionNumber,
        status: 'pending',
        total_cards: totalCards,
        total_market_value: totalMarketValue,
        total_buy_price: totalBuyPrice,
        payment_method: payment_method || 'bank_transfer',
        notes: notes || ''
      }])
      .select()
      .single()

    if (submissionError) {
      console.error('Submission creation error:', submissionError)
      return NextResponse.json(
        { success: false, error: submissionError.message },
        { status: 500 }
      )
    }

    // Create submission cards
    const submissionCards = cards.map((card: any) => ({
      submission_id: submission.id,
      card_name: card.cardName,
      set_code: card.setCode,
      set_name: card.setName,
      collector_number: card.collectorNumber || '',
      condition: card.condition || 'NM',
      language: card.language || 'en',
      foil: card.foil || false,
      quantity: card.quantity,
      market_price: card.marketPrice,
      buy_price: card.buyPrice,
      image_url: card.imageUrl
    }))

    const { error: cardsError } = await supabase
      .from('submission_cards')
      .insert(submissionCards)

    if (cardsError) {
      console.error('Cards insert error:', cardsError)
      // Rollback submission
      await supabase.from('submissions').delete().eq('id', submission.id)
      return NextResponse.json(
        { success: false, error: cardsError.message },
        { status: 500 }
      )
    }

    console.log('Submission created successfully:', submission.id)

    return NextResponse.json({
      success: true,
      submission: {
        id: submission.id,
        submission_number: submission.submission_number
      }
    })

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}