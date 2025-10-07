import React, { useState, useEffect } from 'react'
import { Users, RefreshCw, Download, Search, Calendar, User, Mail, Key, Clock } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

// Use environment variable for API URL, fallback to localhost for development
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface MemberLog {
  id: number
  name: string
  regNo: string
  email: string
  password: string
  timestamp: string
}

interface MemberLogsTableProps {
  className?: string
}

export const MemberLogsTable: React.FC<MemberLogsTableProps> = ({ className = '' }) => {
  const { user } = useAuth()
  const [logs, setLogs] = useState<MemberLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredLogs, setFilteredLogs] = useState<MemberLog[]>([])

  // Filter logs based on search term
  useEffect(() => {
    if (!searchTerm) {
      setFilteredLogs(logs)
    } else {
      const filtered = logs.filter(log =>
        log.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.regNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredLogs(filtered)
    }
  }, [logs, searchTerm])

  const fetchLogs = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin/getMemberLogs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: user?.email })
      })

      if (response.ok) {
        const data = await response.json()
        setLogs(data.data || [])
      } else {
        setError('Failed to fetch member logs')
      }
    } catch (err) {
      setError('Network error while fetching logs')
    } finally {
      setLoading(false)
    }
  }

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      return date.toLocaleString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch {
      return timestamp
    }
  }

  const exportToCsv = () => {
    const csvContent = [
      ['Name', 'Registration No', 'Email', 'Password', 'Timestamp'],
      ...filteredLogs.map(log => [
        log.name,
        log.regNo,
        log.email,
        log.password,
        log.timestamp
      ])
    ]
      .map(row => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `member_logs_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }



  // Load logs on component mount
  useEffect(() => {
    fetchLogs()
  }, [])

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6 text-indigo-600" />
          <h2 className="text-xl font-semibold text-gray-900">Member Entry Logs</h2>
          <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
            {filteredLogs.length} records
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="btn-secondary flex items-center space-x-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          
          <button
            onClick={exportToCsv}
            disabled={filteredLogs.length === 0}
            className="btn-primary flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by name, registration number, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-2 text-gray-600">Loading member logs...</span>
        </div>
      )}

      {/* Table */}
      {!loading && filteredLogs.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>Name</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Reg No</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Key className="h-4 w-4" />
                    <span>Password</span>
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Entry Time</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {log.name || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {log.regNo || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {log.email || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                      {log.password || '-'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimestamp(log.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredLogs.length === 0 && !error && (
        <div className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No member logs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Try adjusting your search criteria' : 'Member entries will appear here when logged'}
          </p>
        </div>
      )}
    </div>
  )
}

export default MemberLogsTable