'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface ShopSettings {
  id: string
  shop_name: string
  shop_logo_url: string
  shop_email: string
  shop_phone: string
  shop_address: string
  shop_city: string
  shop_postal_code: string
  shop_country: string
  default_payment_method: string
  enable_google_auth: boolean
  enable_email_auth: boolean
  enable_submissions: boolean
  require_phone: boolean
  updated_at: string
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

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

    if (!profile || !['admin', 'owner'].includes(profile.role)) {
      alert('Access denied - Admin/Owner only')
      router.push('/admin')
      return
    }

    setLoading(false)
    loadSettings()
  }

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('shop_settings')
        .select('*')
        .single()

      if (error && error.code !== 'PGRST116') throw error

      if (data) {
        setSettings(data)
      } else {
        // Create default settings if none exist
        const defaultSettings = {
          shop_name: 'CardFlow',
          shop_logo_url: '',
          shop_email: '',
          shop_phone: '',
          shop_address: '',
          shop_city: '',
          shop_postal_code: '',
          shop_country: '',
          default_payment_method: 'bank_transfer',
          enable_google_auth: true,
          enable_email_auth: true,
          enable_submissions: true,
          require_phone: false,
        }

        const { data: newSettings, error: createError } = await supabase
          .from('shop_settings')
          .insert([defaultSettings])
          .select()
          .single()

        if (createError) throw createError

        setSettings(newSettings)
      }
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('shop_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', settings.id)

      if (error) throw error

      alert('Settings saved successfully!')
      loadSettings()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const filePath = `logos/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('shop-assets')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('shop-assets')
        .getPublicUrl(filePath)

      setSettings(prev => prev ? { ...prev, shop_logo_url: data.publicUrl } : null)
      alert('Logo uploaded! Click Save to apply changes.')
    } catch (error: any) {
      alert(`Error uploading logo: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-cyan-500">Loading...</div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-xl text-gray-400">No settings found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-cyan-500 mb-2">Shop Settings</h1>
          <p className="text-gray-400">Configure your shop's information and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-700">
          {['general', 'contact', 'authentication', 'features'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-semibold transition-colors border-b-2 ${
                activeTab === tab
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* General Tab */}
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">General Information</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2">Shop Name</label>
                  <input
                    type="text"
                    value={settings.shop_name}
                    onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                    placeholder="CardFlow"
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This name appears in the header and throughout the site
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Shop Logo</label>
                  {settings.shop_logo_url && (
                    <div className="mb-3">
                      <img
                        src={settings.shop_logo_url}
                        alt="Shop logo"
                        className="h-20 rounded border border-slate-700"
                      />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="input-field w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Upload a logo (PNG, JPG, or SVG recommended)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Default Payment Method</label>
                  <select
                    value={settings.default_payment_method}
                    onChange={(e) => setSettings({ ...settings, default_payment_method: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="store_credit">Store Credit</option>
                    <option value="cash">Cash</option>
                    <option value="paypal">PayPal</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Pre-selected payment method for new submissions
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Contact Tab */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Contact Information</h2>
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Email</label>
                    <input
                      type="email"
                      value={settings.shop_email}
                      onChange={(e) => setSettings({ ...settings, shop_email: e.target.value })}
                      placeholder="contact@cardflow.com"
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Phone</label>
                    <input
                      type="tel"
                      value={settings.shop_phone}
                      onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                      placeholder="+49 123 456789"
                      className="input-field w-full"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2">Street Address</label>
                  <input
                    type="text"
                    value={settings.shop_address}
                    onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                    placeholder="123 Main Street"
                    className="input-field w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">City</label>
                    <input
                      type="text"
                      value={settings.shop_city}
                      onChange={(e) => setSettings({ ...settings, shop_city: e.target.value })}
                      placeholder="Kappeln"
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Postal Code</label>
                    <input
                      type="text"
                      value={settings.shop_postal_code}
                      onChange={(e) => setSettings({ ...settings, shop_postal_code: e.target.value })}
                      placeholder="24376"
                      className="input-field w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Country</label>
                    <input
                      type="text"
                      value={settings.shop_country}
                      onChange={(e) => setSettings({ ...settings, shop_country: e.target.value })}
                      placeholder="Germany"
                      className="input-field w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Authentication Tab */}
        {activeTab === 'authentication' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Authentication Options</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-semibold">Google OAuth</div>
                    <div className="text-sm text-gray-400">Allow users to sign in with Google</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enable_google_auth: !settings.enable_google_auth })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enable_google_auth ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enable_google_auth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-semibold">Email/Password</div>
                    <div className="text-sm text-gray-400">Allow users to sign up with email</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enable_email_auth: !settings.enable_email_auth })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enable_email_auth ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enable_email_auth ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="bg-blue-900 bg-opacity-30 border border-blue-500 p-4 rounded-lg mt-4">
                  <p className="text-sm text-blue-300">
                    <strong>Note:</strong> At least one authentication method must be enabled. 
                    Changes to authentication settings will take effect immediately.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Features Tab */}
        {activeTab === 'features' && (
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Feature Toggles</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-semibold">Enable Submissions</div>
                    <div className="text-sm text-gray-400">Allow customers to submit card buylist requests</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, enable_submissions: !settings.enable_submissions })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.enable_submissions ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.enable_submissions ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
                  <div>
                    <div className="font-semibold">Require Phone Number</div>
                    <div className="text-sm text-gray-400">Make phone number mandatory in user profiles</div>
                  </div>
                  <button
                    onClick={() => setSettings({ ...settings, require_phone: !settings.require_phone })}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      settings.require_phone ? 'bg-cyan-500' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        settings.require_phone ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {!settings.enable_submissions && (
                  <div className="bg-yellow-900 bg-opacity-30 border border-yellow-500 p-4 rounded-lg mt-4">
                    <p className="text-sm text-yellow-300">
                      <strong>⚠️ Warning:</strong> Submissions are currently disabled. 
                      Users will not be able to create new buylist requests.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end gap-4 mt-6">
          <button
            onClick={loadSettings}
            className="btn-outline"
          >
            Reset Changes
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>

        {/* Last Updated */}
        {settings.updated_at && (
          <p className="text-center text-sm text-gray-500 mt-4">
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}