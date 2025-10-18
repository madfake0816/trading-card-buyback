'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface User {
  id: string
  email: string
  name: string
  phone: string
  role: string
  created_at: string
  last_sign_in_at: string
}

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [newRole, setNewRole] = useState('')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (!loading) {
      loadUsers()
    }
  }, [filterRole, loading])

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
  }

  const loadUsers = async () => {
    try {
      let query = supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false })

      if (filterRole !== 'all') {
        query = query.eq('role', filterRole)
      }

      const { data, error } = await query

      if (error) throw error

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const handleUpdateRole = async () => {
    if (!editingUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', editingUser.id)

      if (error) throw error

      alert('User role updated successfully!')
      setEditingUser(null)
      loadUsers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return
    }

    try {
      // First delete user's data
      await supabase.from('submissions').delete().eq('user_id', userId)
      await supabase.from('users').delete().eq('id', userId)

      alert('User deleted successfully!')
      loadUsers()
    } catch (error: any) {
      alert(`Error: ${error.message}`)
    }
  }

  const filteredUsers = users.filter(user => 
    searchQuery === '' ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-purple-600'
      case 'admin': return 'bg-red-600'
      case 'staff': return 'bg-blue-600'
      case 'customer': return 'bg-gray-600'
      default: return 'bg-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-2xl text-cyan-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <Link href="/admin" className="text-cyan-500 hover:text-cyan-400 mb-4 inline-block">
            ← Back to Dashboard
          </Link>
          <h1 className="text-4xl font-bold text-cyan-500">Manage Users</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="card p-4">
            <div className="text-2xl font-bold text-cyan-500">{users.length}</div>
            <div className="text-sm text-gray-400">Total Users</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-purple-500">
              {users.filter(u => u.role === 'owner').length}
            </div>
            <div className="text-sm text-gray-400">Owners</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-red-500">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <div className="text-sm text-gray-400">Admins</div>
          </div>
          <div className="card p-4">
            <div className="text-2xl font-bold text-blue-500">
              {users.filter(u => u.role === 'staff').length}
            </div>
            <div className="text-sm text-gray-400">Staff</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="card p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <input
              type="text"
              placeholder="Search by email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field flex-1"
            />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="input-field"
            >
              <option value="all">All Roles</option>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="staff">Staff</option>
              <option value="customer">Customer</option>
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Joined</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-400 uppercase">Last Sign In</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold">{user.name || 'No name'}</div>
                      <div className="text-sm text-gray-400">{user.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-white text-xs font-semibold ${getRoleBadgeColor(user.role)}`}>
                        {user.role?.toUpperCase() || 'CUSTOMER'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.phone || '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-400">
                      {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setEditingUser(user)
                          setNewRole(user.role || 'customer')
                        }}
                        className="text-cyan-500 hover:text-cyan-400 mr-3"
                      >
                        Edit Role
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Edit Role Modal */}
        {editingUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="card p-6 max-w-md w-full">
              <h2 className="text-2xl font-bold text-cyan-500 mb-4">Edit User Role</h2>
              <div className="mb-4">
                <p className="text-gray-400 mb-2">User: <span className="text-white font-semibold">{editingUser.email}</span></p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-semibold mb-2">Role</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="customer">Customer</option>
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="owner">Owner</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">
                  <strong>Customer:</strong> Can submit cards<br />
                  <strong>Staff:</strong> Can view and manage submissions<br />
                  <strong>Admin:</strong> Full access to dashboard<br />
                  <strong>Owner:</strong> Full access including user management
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={handleUpdateRole} className="btn-primary flex-1">
                  Save Changes
                </button>
                <button onClick={() => setEditingUser(null)} className="btn-outline flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}