import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  console.log('🏪 Creating shop...')
  
  try {
    const supabase = await createClient()
    
    // Check for existing shop first
    const { data: existingShops, error: fetchError } = await supabase
      .from('shops')
      .select('*')
      .limit(1)
    
    if (fetchError) {
      console.error('Error checking shops:', fetchError)
      return NextResponse.json({ 
        error: 'Failed to check shops',
        details: fetchError.message 
      }, { status: 500 })
    }

    if (existingShops && existingShops.length > 0) {
      console.log('✅ Shop already exists:', existingShops[0].id)
      return NextResponse.json({ 
        success: true, 
        shop: existingShops[0],
        message: 'Shop already exists',
        envVariable: `NEXT_PUBLIC_DEFAULT_SHOP_ID=${existingShops[0].id}`
      })
    }

    // Create new shop
    console.log('Creating new shop...')
    const { data: newShop, error: createError } = await supabase
      .from('shops')
      .insert({
        name: 'CardFlow Demo Shop',
        email: 'demo@cardflow.com',
        default_cash_percentage: 0.50,
        store_credit_bonus: 0.10,
        currency: 'EUR'
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating shop:', createError)
      return NextResponse.json({ 
        error: 'Failed to create shop',
        details: createError.message 
      }, { status: 500 })
    }

    console.log('✅ Shop created:', newShop.id)
    return NextResponse.json({ 
      success: true, 
      shop: newShop,
      envVariable: `NEXT_PUBLIC_DEFAULT_SHOP_ID=${newShop.id}`
    })
    
  } catch (error: any) {
    console.error('❌ Setup error:', error)
    return NextResponse.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 })
  }
}