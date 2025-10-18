'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface AnalyticsData {
  totalSubmissions: number
  totalCards: number
  totalMarketValue: number
  totalBuyPrice: number
  averageBuyPrice: number
  submissionsByStatus: {
    pending: number
    accepted: number
    rejected: number
    paid: number
  }
  submissionsByPaymentMethod: {
    [key: string]: number
  }
  recentActivity: Array<{
    date: string
    submissions: number
    cards: number
    value: number
  }>
  topCustomers: Array<{
    email: string
    name: string
    submissions: number
    totalValue: number
  }>
  cardStats: {
    totalUnique: number
    mostCommonSets: Array<{
      set_name: string
      count: number
    }>
    averageMarketPrice: number
    averageBuyPrice: number
  }
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30d')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadAnalytics()
    }
  }, [dateRange, loading])

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      router.push('/auth/signin')
      return
    }

    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['admin', 'owner', 'staff'].includes(profile.role)) {
      alert('Access denied')
      router.push('/admin')
      return
    }

    setLoading(false)
  }

  const loadAnalytics = async () => {
    try {
      // Calculate date range
      let queryStartDate = new Date()
      
      if (dateRange === '7d') {
        queryStartDate.setDate(queryStartDate.getDate() - 7)
      } else if (dateRange === '30d') {
        queryStartDate.setDate(queryStartDate.getDate() - 30)
      } else if (dateRange === '90d') {
        queryStartDate.setDate(queryStartDate.getDate() - 90)
      } else if (dateRange === 'custom' && startDate) {
        queryStartDate = new Date(startDate)
      } else {
        queryStartDate.setFullYear(queryStartDate.getFullYear() - 10) // All time
      }

      const queryEndDate = dateRange === 'custom' && endDate ? new Date(endDate) : new Date()

      // Fetch submissions
      const { data: submissions, error: submissionsError } = await supabase
        .from('submissions')
        .select(`
          *,
          users!submissions_user_id_fkey (
            email,
            name
          )
        `)
        .gte('created_at', queryStartDate.toISOString())
        .lte('created_at', queryEndDate.toISOString())

      if (submissionsError) throw submissionsError

      // Fetch submission cards
      const { data: cards, error: cardsError } = await supabase
        .from('submission_cards')
        .select('*')
        .in('submission_id', submissions?.map(s => s.id) || [])

      if (cardsError) throw cardsError

      // Calculate analytics
      const totalSubmissions = submissions?.length || 0
      const totalCards = submissions?.reduce((sum, s) => sum + s.total_cards, 0) || 0
      const totalMarketValue = submissions?.reduce((sum, s) => sum + parseFloat(s.total_market_value.toString()), 0) || 0
      const totalBuyPrice = submissions?.reduce((sum, s) => sum + parseFloat(s.total_buy_price.toString()), 0) || 0

      // Submissions by status
      const submissionsByStatus = {
        pending: submissions?.filter(s => s.status === 'pending').length || 0,
        accepted: submissions?.filter(s => s.status === 'accepted').length || 0,
        rejected: submissions?.filter(s => s.status === 'rejected').length || 0,
        paid: submissions?.filter(s => s.status === 'paid').length || 0,
      }

      // Submissions by payment method
      const submissionsByPaymentMethod: { [key: string]: number } = {}
      submissions?.forEach(s => {
        const method = s.payment_method || 'unknown'
        submissionsByPaymentMethod[method] = (submissionsByPaymentMethod[method] || 0) + 1
      })

      // Recent activity (group by date)
      const activityMap = new Map<string, { submissions: number, cards: number, value: number }>()
      submissions?.forEach(s => {
        const date = new Date(s.created_at).toLocaleDateString()
        const existing = activityMap.get(date) || { submissions: 0, cards: 0, value: 0 }
        activityMap.set(date, {
          submissions: existing.submissions + 1,
          cards: existing.cards + s.total_cards,
          value: existing.value + parseFloat(s.total_buy_price.toString())
        })
      })

      const recentActivity = Array.from(activityMap.entries())
        .map(([date, data]) => ({ date, ...data }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 14)

      // Top customers
      const customerMap = new Map<string, { email: string, name: string, submissions: number, totalValue: number }>()
      submissions?.forEach(s => {
        const email = s.users?.email || 'unknown'
        const name = s.users?.name || 'Unknown'
        const existing = customerMap.get(email) || { email, name, submissions: 0, totalValue: 0 }
        customerMap.set(email, {
          ...existing,
          submissions: existing.submissions + 1,
          totalValue: existing.totalValue + parseFloat(s.total_buy_price.toString())
        })
      })

      const topCustomers = Array.from(customerMap.values())
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 10)

      // Card stats
      const uniqueCards = new Set(cards?.map(c => c.card_name))
      const setCount = new Map<string, number>()
      cards?.forEach(c => {
        setCount.set(c.set_name, (setCount.get(c.set_name) || 0) + c.quantity)
      })

      const mostCommonSets = Array.from(setCount.entries())
        .map(([set_name, count]) => ({ set_name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)

      const totalCardMarketPrice = cards?.reduce((sum, c) => sum + (parseFloat(c.market_price.toString()) * c.quantity), 0) || 0
      const totalCardBuyPrice = cards?.reduce((sum, c) => sum + (parseFloat(c.buy_price.toString()) * c.quantity), 0) || 0
      const totalCardCount = cards?.reduce((sum, c) => sum + c.quantity, 0) || 1

      setAnalytics({
        totalSubmissions,
        totalCards,
        totalMarketValue,
        totalBuyPrice,
        averageBuyPrice: totalSubmissions > 0 ? totalBuyPrice / totalSubmissions : 0,
        submissionsByStatus,
        submissionsByPaymentMethod,
        recentActivity,
        topCustomers,
        cardStats: {
          totalUnique: uniqueCards.size,
          mostCommonSets,
          averageMarketPrice: totalCardMarketPrice / totalCardCount,
          averageBuyPrice: totalCardBuyPrice / totalCardCount,
        }
      })

    } catch (error) {
      console.error('Error loading analytics:', error)
      alert('Failed to load analytics')
    }
  }

  const exportToCSV = () => {
    if (!analytics) return

    const csvData = [
      ['Metric', 'Value'],
      ['Total Submissions', analytics.totalSubmissions],
      ['Total Cards', analytics.totalCards],
      ['Total Market Value', `€${analytics.totalMarketValue.toFixed(2)}`],
      ['Total Buy Price', `€${analytics.totalBuyPrice.toFixed(2)}`],
      ['Average Buy Price per Submission', `€${analytics.averageBuyPrice.toFixed(2)}`],
      [''],
      ['Status', 'Count'],
      ['Pending', analytics.submissionsByStatus.pending],
      ['Accepted', analytics.submissionsByStatus.accepted],
      ['Rejected', analytics.submissionsByStatus.rejected],
      ['Paid', analytics.submissionsByStatus.paid],
    ]

    const csv = csvData.map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `analytics-${dateRange}-${new Date().toISOString()}.csv`
    a.click()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-cyan-500">Loading...</div>
      </div>
    )
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">No data available</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
              ← Back to Dashboard
            </Link>
            <h1 className="text-4xl font-bold text-cyan-500">Analytics & Reports</h1>
          </div>
          <button onClick={exportToCSV} className="btn-primary">
            📊 Export CSV
          </button>
        </div>

        {/* Date Range Selector */}
        <div className="card p-4 mb-6">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex gap-2">
              {['7d', '30d', '90d', 'all', 'custom'].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                    dateRange === range
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-800 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  {range === '7d' ? 'Last 7 Days' :
                   range === '30d' ? 'Last 30 Days' :
                   range === '90d' ? 'Last 90 Days' :
                   range === 'all' ? 'All Time' :
                   'Custom Range'}
                </button>
              ))}
            </div>
            
            {dateRange === 'custom' && (
              <div className="flex gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <button onClick={loadAnalytics} className="btn-primary self-end">
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-3xl font-bold text-cyan-500">{analytics.totalSubmissions}</div>
            <div className="text-sm text-gray-400 mt-2">Total Submissions</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-emerald-500">{analytics.totalCards}</div>
            <div className="text-sm text-gray-400 mt-2">Total Cards</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-blue-500">
              €{analytics.totalMarketValue.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Market Value</div>
          </div>
          
          <div className="card p-6">
            <div className="text-3xl font-bold text-purple-500">
              €{analytics.totalBuyPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Total Buy Price</div>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card p-6">
            <div className="text-2xl font-bold text-cyan-500">
              €{analytics.averageBuyPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Avg. Buy Price per Submission</div>
          </div>
          
          <div className="card p-6">
            <div className="text-2xl font-bold text-emerald-500">
              {analytics.cardStats.totalUnique}
            </div>
            <div className="text-sm text-gray-400 mt-2">Unique Cards</div>
          </div>
          
          <div className="card p-6">
            <div className="text-2xl font-bold text-blue-500">
              €{analytics.cardStats.averageBuyPrice.toFixed(2)}
            </div>
            <div className="text-sm text-gray-400 mt-2">Avg. Buy Price per Card</div>
          </div>
        </div>

        {/* Submissions by Status */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Submissions by Status</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-yellow-900 bg-opacity-30 border border-yellow-600 p-4 rounded-lg">
              <div className="text-3xl font-bold text-yellow-500">
                {analytics.submissionsByStatus.pending}
              </div>
              <div className="text-sm text-gray-400 mt-2">Pending</div>
            </div>
            <div className="bg-green-900 bg-opacity-30 border border-green-600 p-4 rounded-lg">
              <div className="text-3xl font-bold text-green-500">
                {analytics.submissionsByStatus.accepted}
              </div>
              <div className="text-sm text-gray-400 mt-2">Accepted</div>
            </div>
            <div className="bg-red-900 bg-opacity-30 border border-red-600 p-4 rounded-lg">
              <div className="text-3xl font-bold text-red-500">
                {analytics.submissionsByStatus.rejected}
              </div>
              <div className="text-sm text-gray-400 mt-2">Rejected</div>
            </div>
            <div className="bg-blue-900 bg-opacity-30 border border-blue-600 p-4 rounded-lg">
              <div className="text-3xl font-bold text-blue-500">
                {analytics.submissionsByStatus.paid}
              </div>
              <div className="text-sm text-gray-400 mt-2">Paid</div>
            </div>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Payment Methods</h2>
          <div className="space-y-3">
            {Object.entries(analytics.submissionsByPaymentMethod).map(([method, count]) => (
              <div key={method} className="flex items-center justify-between bg-slate-800 p-4 rounded-lg">
                <span className="font-semibold capitalize">{method.replace('_', ' ')}</span>
                <span className="text-cyan-500 font-bold">{count} submissions</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Recent Activity</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Date</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Submissions</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Cards</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {analytics.recentActivity.map((activity) => (
                  <tr key={activity.date} className="hover:bg-slate-800">
                    <td className="px-4 py-2">{activity.date}</td>
                    <td className="px-4 py-2">{activity.submissions}</td>
                    <td className="px-4 py-2">{activity.cards}</td>
                    <td className="px-4 py-2 text-emerald-500 font-semibold">
                      €{activity.value.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="card p-6 mb-8">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Top Customers</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Customer</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Submissions</th>
                  <th className="px-4 py-2 text-left text-sm font-semibold">Total Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {analytics.topCustomers.map((customer) => (
                  <tr key={customer.email} className="hover:bg-slate-800">
                    <td className="px-4 py-2">
                      <div className="font-semibold">{customer.name}</div>
                      <div className="text-sm text-gray-400">{customer.email}</div>
                    </td>
                    <td className="px-4 py-2">{customer.submissions}</td>
                    <td className="px-4 py-2 text-emerald-500 font-semibold">
                      €{customer.totalValue.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Most Common Sets */}
        <div className="card p-6">
          <h2 className="text-2xl font-bold text-cyan-500 mb-4">Most Common Sets</h2>
          <div className="space-y-3">
            {analytics.cardStats.mostCommonSets.map((set, index) => (
              <div key={set.set_name} className="flex items-center justify-between bg-slate-800 p-4 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold text-gray-600">#{index + 1}</span>
                  <span className="font-semibold">{set.set_name}</span>
                </div>
                <span className="text-cyan-500 font-bold">{set.count} cards</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}