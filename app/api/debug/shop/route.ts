import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Try to get shop settings
    const { data: shop, error } = await supabase
      .from('shop_settings')
      .select('*')
      .single()
    
    // Check auth status
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    // Get all shops (in case single() fails)
    const { data: allShops, error: allError } = await supabase
      .from('shop_settings')
      .select('*')
    
    return NextResponse.json({
      environment: process.env.VERCEL_ENV || 'local',
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrlPrefix: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 40),
      shop,
      error: error?.message || null,
      errorCode: error?.code || null,
      errorDetails: error?.details || null,
      hasShop: !!shop,
      shopId: shop?.id,
      user: user?.id || 'not authenticated',
      authError: authError?.message || null,
      allShops,
      allShopsError: allError?.message || null,
      shopCount: allShops?.length || 0
    })
  } catch (err: any) {
    return NextResponse.json({
      error: 'Exception thrown',
      message: err.message,
      stack: err.stack
    })
  }
}