'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function TestDBPage() {
  const [status, setStatus] = useState('Testing...')
  const [shops, setShops] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    testConnection()
  }, [])

  const testConnection = async () => {
    try {
      const supabase = createClient()
      
      // Test 1: Can we connect?
      setStatus('✅ Connected to Supabase')
      
      // Test 2: Can we read shops?
      const { data, error } = await supabase
        .from('shops')
        .select('*')
      
      if (error) throw error
      
      setShops(data || [])
      setStatus('✅ Connection successful!')
      
    } catch (err: any) {
      console.error('Connection error:', err)
      setError(err.message)
      setStatus('❌ Connection failed')
    }
  }

  return (
    <div className="min-h-screen bg-dark-blue p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-yellow-accent mb-6">
          Database Connection Test
        </h1>
        
        <div className="card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status:</h2>
          <p className="text-lg mb-4">{status}</p>
          
          {error && (
            <div className="bg-red-900 bg-opacity-30 border border-red-500 p-4 rounded">
              <p className="font-mono text-sm">{error}</p>
            </div>
          )}
        </div>

        {shops.length > 0 && (
          <div className="card p-6">
            <h2 className="text-xl font-semibold mb-4">Shops in Database:</h2>
            {shops.map(shop => (
              <div key={shop.id} className="bg-dark-blue-light p-4 rounded mb-2">
                <p><strong>Name:</strong> {shop.name}</p>
                <p><strong>Email:</strong> {shop.email}</p>
                <p className="text-xs text-gray-400 mt-2">ID: {shop.id}</p>
              </div>
            ))}
          </div>
        )}

        <div className="card p-6 mt-6">
          <h3 className="font-semibold mb-2">Environment Check:</h3>
          <p className="text-sm text-gray-400 mb-1">
            URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}
          </p>
          <p className="text-sm text-gray-400">
            Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}
          </p>
        </div>
      </div>
    </div>
  )
}