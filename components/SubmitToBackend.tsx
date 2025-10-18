'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useSellListStore } from '@/context/SellListContext'
import { useLanguage } from '@/context/LanguageContext'
import AuthButton from './AuthButton'
import Link from 'next/link'

export default function SubmitToBackend() {
  const { language } = useLanguage()
  const items = useSellListStore((state) => state.items)
  const clearList = useSellListStore((state) => state.clearList)
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [submissionNumber, setSubmissionNumber] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'store_credit'>('cash')
  const [notes, setNotes] = useState('')
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

 const handleSubmit = async () => {
  if (items.length === 0) {
    alert(language === 'de' ? 'Keine Karten in der Liste!' : 'No cards in the list!')
    return
  }

  if (!user) {
    alert(language === 'de'
      ? 'Bitte melden Sie sich an, um fortzufahren'
      : 'Please sign in to continue'
    )
    return
  }

  setLoading(true)

  try {
    const shopId = process.env.NEXT_PUBLIC_DEFAULT_SHOP_ID

    console.log('Submitting to backend...')
    console.log('Shop ID:', shopId)
    console.log('Cards:', items.length)

    const response = await fetch('/api/submissions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shopId,
        cards: items.map(item => ({
          cardName: item.cardName,
          setCode: item.setCode,
          setName: item.setName,
          collectorNumber: item.collectorNumber,
          condition: item.condition || 'NM',
          language: item.language || 'en',
          foil: item.foil || false,
          quantity: item.quantity,
          marketPrice: item.marketPrice,
          buyPrice: item.buyPrice,
          imageUrl: item.imageUrl,
          tcg: item.tcg || 'Magic: The Gathering'
        })),
        paymentMethod,
        notes
      })
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', response.headers.get('content-type'))

    // Check if response is JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text()
      console.error('Non-JSON response:', text.substring(0, 200))
      throw new Error('Server returned HTML instead of JSON. Check if API route exists.')
    }

    const data = await response.json()
    console.log('Response data:', data)

    if (!response.ok) {
      throw new Error(data.error || 'Submission failed')
    }

    setSubmissionNumber(data.submission.submission_number)
    setSubmitted(true)
    clearList()

    alert(language === 'de'
      ? `Erfolgreich eingereicht! Nummer: ${data.submission.submission_number}`
      : `Successfully submitted! Number: ${data.submission.submission_number}`
    )

  } catch (error: any) {
    console.error('Submission error:', error)
    alert(language === 'de' 
      ? `Fehler: ${error.message}` 
      : `Error: ${error.message}`
    )
  } finally {
    setLoading(false)
  }
}

  if (items.length === 0) {
    return null
  }

  if (submitted && submissionNumber) {
    return (
      <div className="bg-green-900 bg-opacity-30 border border-green-500 rounded-lg p-4">
        <div className="text-green-400 font-bold mb-2">
          {language === 'de' ? 'Erfolgreich!' : 'Success!'}
        </div>
        <div className="text-sm text-gray-300 mb-3">
          {language === 'de' ? 'Nummer:' : 'Number:'}{' '}
          <span className="font-mono font-bold">{submissionNumber}</span>
        </div>
        <Link
          href="/submissions"
          className="inline-block text-sm text-cyan-400 hover:text-cyan-300 underline"
        >
          {language === 'de' ? 'Meine Submissions' : 'View My Submissions'}
        </Link>
      </div>
    )
  }

  return (
    <div className="border-t border-slate-700 pt-4">
      <h3 className="text-lg font-bold text-cyan-500 mb-4">
        {language === 'de' ? 'Submission' : 'Submission'}
      </h3>

      {!user && (
        <div className="bg-blue-900 bg-opacity-20 border border-blue-500 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-300 mb-3">
            {language === 'de'
              ? 'Bitte melden Sie sich an, um Ihre Karten einzureichen'
              : 'Please sign in to submit your cards'
            }
          </p>
          <AuthButton />
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">
          {language === 'de' ? 'Zahlungsmethode' : 'Payment Method'}
        </label>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="cash"
              checked={paymentMethod === 'cash'}
              onChange={(e) => setPaymentMethod(e.target.value as 'cash')}
              className="mr-2"
            />
            <span className="text-sm">{language === 'de' ? 'Bar' : 'Cash'}</span>
          </label>
          <label className="flex items-center cursor-pointer">
            <input
              type="radio"
              value="store_credit"
              checked={paymentMethod === 'store_credit'}
              onChange={(e) => setPaymentMethod(e.target.value as 'store_credit')}
              className="mr-2"
            />
            <span className="text-sm">Store Credit (+10%)</span>
          </label>
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">
          {language === 'de' ? 'Notizen (optional)' : 'Notes (optional)'}
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder={language === 'de' ? 'Zusätzliche Infos...' : 'Additional info...'}
          className="input-field w-full min-h-[60px] text-sm resize-none"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading || !user}
        className="btn-primary w-full"
      >
        {loading
          ? (language === 'de' ? 'Wird eingereicht...' : 'Submitting...')
          : (language === 'de' ? 'Jetzt einreichen' : 'Submit Now')
        }
      </button>

      {!user && (
        <p className="text-xs text-gray-500 mt-2 text-center">
          {language === 'de' ? 'Anmelden erforderlich' : 'Sign in required'}
        </p>
      )}
    </div>
  )
}