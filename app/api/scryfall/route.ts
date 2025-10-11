import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const endpoint = searchParams.get('endpoint')
    
    console.log('=== SCRYFALL PROXY REQUEST ===')
    console.log('Endpoint:', endpoint)
    
    if (!endpoint) {
      console.error('No endpoint provided')
      return NextResponse.json({ error: 'No endpoint provided' }, { status: 400 })
    }

    const scryfallUrl = `https://api.scryfall.com${endpoint}`
    console.log('Fetching from Scryfall:', scryfallUrl)
    
    // Add a small delay to respect rate limits
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const response = await fetch(scryfallUrl)
    console.log('Scryfall response status:', response.status)
    
    if (!response.ok) {
      if (response.status === 404) {
        console.log('Card not found (404), returning empty results')
        return NextResponse.json({ 
          object: 'list',
          data: [],
          has_more: false,
          total_cards: 0
        })
      }
      
      if (response.status === 429) {
        console.warn('Rate limit hit (429)')
        // Wait longer and retry once
        await new Promise(resolve => setTimeout(resolve, 1000))
        const retryResponse = await fetch(scryfallUrl)
        if (retryResponse.ok) {
          const retryData = await retryResponse.json()
          return NextResponse.json(retryData)
        }
        
        return NextResponse.json(
          { 
            object: 'error',
            code: 'rate_limit',
            details: 'Too many requests',
            data: []
          }
        )
      }
      
      console.error('Scryfall error:', response.status)
      return NextResponse.json(
        { error: `Scryfall API error: ${response.status}`, data: [] }, 
        { status: 200 } // Return 200 with empty data instead of error status
      )
    }
    
    const data = await response.json()
    console.log('Success! Returned', data.data?.length || 0, 'results')
    return NextResponse.json(data)
    
  } catch (error) {
    console.error('=== SCRYFALL PROXY ERROR ===')
    console.error(error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch from Scryfall',
        details: error instanceof Error ? error.message : 'Unknown error',
        data: []
      }, 
      { status: 500 }
    )
  }
}