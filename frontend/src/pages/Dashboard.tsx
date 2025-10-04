import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import OtpTimer from '../components/OtpTimer'
import MemberLogsTable from '../components/MemberLogsTable'
import { 
  Users, 
  Calendar, 
  Shield, 
  Download, 
  RefreshCw,
  User,
  Mail,
  Clock,
  Key,
  UserPlus,
  ArrowRight,
  CheckCircle,
  LogOut,
  DoorOpen,
  AlertCircle
} from 'lucide-react'

interface MemberEntry {
  regNo: string
  email: string
  timestamp: string
  password: string
}

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth()
  const [memberEntries, setMemberEntries] = useState<MemberEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [stats, setStats] = useState({
    totalEntries: 0,
    todayEntries: 0,
    uniqueMembers: 0
  })

  // Member Entry Form State
  const [memberForm, setMemberForm] = useState({
    name: '',
    regNo: '',
    email: ''
  })
  const [memberEntryLoading, setMemberEntryLoading] = useState(false)
  const [memberEntrySuccess, setMemberEntrySuccess] = useState(false)
  const [memberEntryError, setMemberEntryError] = useState('')
  const [generatedPassword, setGeneratedPassword] = useState('')
  const [lastAddedMember, setLastAddedMember] = useState<{name: string, email: string} | null>(null)

  const fetchMemberEntries = async () => {
    setLoading(true)
    setError('')

    try {
      // For demo purposes, use mock data
      const mockData: MemberEntry[] = [
        {
          regNo: 'REG001',
          email: 'student1@university.edu',
          timestamp: new Date().toISOString(),
          password: 'abc123'
        },
        {
          regNo: 'REG002',
          email: 'student2@university.edu',
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
          password: 'def456'
        },
        {
          regNo: 'REG003',
          email: 'student3@university.edu',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
          password: 'ghi789'
        }
      ]
      setMemberEntries(mockData)
      calculateStats(mockData)
    } catch (err) {
      setError('Failed to fetch member entries')
    }

    setLoading(false)
  }

  const calculateStats = (entries: MemberEntry[]) => {
    const today = new Date().toDateString()
    const todayEntries = entries.filter(entry => 
      new Date(entry.timestamp).toDateString() === today
    ).length

    const uniqueMembers = new Set(entries.map(entry => entry.regNo)).size

    setStats({
      totalEntries: entries.length,
      todayEntries,
      uniqueMembers
    })
  }

  // OTP-verified password change state
  const [passwordChangeStep, setPasswordChangeStep] = useState<'initial' | 'otp-sent' | 'completed'>('initial')
  const [passwordChangeOtp, setPasswordChangeOtp] = useState('')
  const [passwordChangeError, setPasswordChangeError] = useState('')

  // Door OTP generation state
  const [doorOtpLoading, setDoorOtpLoading] = useState(false)
  const [doorOtpError, setDoorOtpError] = useState('')
  const [doorOtpSuccess, setDoorOtpSuccess] = useState('')
  const [doorOtpExpiresAt, setDoorOtpExpiresAt] = useState<number | null>(null)
  const [doorOtpCode, setDoorOtpCode] = useState('')

  const initiatePasswordChange = async () => {
    setLoading(true)
    setPasswordChangeError('')

    try {
      const response = await fetch('http://localhost:3000/changepassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user?.email
        })
      })

      const responseText = await response.text()

      if (response.ok) {
        setPasswordChangeStep('otp-sent')
        setError('')
      } else {
        setPasswordChangeError(responseText || 'Failed to send OTP for password change')
      }
    } catch (err) {
      setPasswordChangeError('Network error. Please try again.')
    }

    setLoading(false)
  }

  const confirmPasswordChange = async () => {
    if (!passwordChangeOtp || passwordChangeOtp.length !== 6) {
      setPasswordChangeError('Please enter a valid 6-digit OTP')
      return
    }

    setLoading(true)
    setPasswordChangeError('')

    try {
      const response = await fetch('http://localhost:3000/changepassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user?.email,
          otp: passwordChangeOtp,
          confirm: true
        })
      })

      const responseText = await response.text()

      if (response.ok) {
        setPasswordChangeStep('completed')
        setPasswordChangeOtp('')
        fetchMemberEntries() // Refresh the list to show new passwords
        setTimeout(() => setPasswordChangeStep('initial'), 3000) // Reset after 3 seconds
      } else {
        setPasswordChangeError(responseText || 'Failed to change passwords')
      }
    } catch (err) {
      setPasswordChangeError('Network error. Please try again.')
    }

    setLoading(false)
  }

  const generateDoorOtp = async () => {
    setDoorOtpLoading(true)
    setDoorOtpError('')
    setDoorOtpSuccess('')

    try {
      const response = await fetch('http://localhost:3000/admin/generateDoorOtp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: user?.email
        })
      })

      if (response.ok) {
        const data = await response.json()
        setDoorOtpSuccess('Door OTP generated and sent to admin emails!')
        setDoorOtpCode(data.otp || '')
        setDoorOtpExpiresAt(data.expiresAt || null)
        setTimeout(() => {
          setDoorOtpSuccess('')
          setDoorOtpCode('')
          setDoorOtpExpiresAt(null)
        }, 15 * 60 * 1000) // Clear after 15 minutes
      } else {
        const responseText = await response.text()
        setDoorOtpError(responseText || 'Failed to generate door OTP')
      }
    } catch (err) {
      setDoorOtpError('Network error. Please try again.')
    }

    setDoorOtpLoading(false)
  }

  const exportToCsv = () => {
    const csvContent = [
      ['Registration Number', 'Email', 'Timestamp', 'Password'].join(','),
      ...memberEntries.map(entry => [
        entry.regNo,
        entry.email,
        entry.timestamp,
        entry.password
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `member-entries-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleString()
  }

  // Member Entry Functions
  const handleMemberFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMemberForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    setMemberEntryError('')
    setMemberEntrySuccess(false)
  }

  const validateMemberForm = () => {
    if (!memberForm.name.trim()) {
      setMemberEntryError('Member name is required')
      return false
    }
    if (!memberForm.regNo.trim()) {
      setMemberEntryError('Registration number is required')
      return false
    }
    if (!memberForm.email.trim()) {
      setMemberEntryError('Email is required')
      return false
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(memberForm.email)) {
      setMemberEntryError('Please enter a valid email address')
      return false
    }
    return true
  }

  const handleMemberSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMemberEntryLoading(true)
    setMemberEntryError('')
    setMemberEntrySuccess(false)

    if (!validateMemberForm()) {
      setMemberEntryLoading(false)
      return
    }

    try {
      const response = await fetch('http://localhost:3000/enter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: memberForm.name.trim(),
          regNo: memberForm.regNo.trim(),
          email: memberForm.email.trim()
        })
      })

      const data = await response.json()

      if (response.ok) {
        setMemberEntrySuccess(true)
        setGeneratedPassword(data.password)
        
        // Store member info for success message before clearing form
        const memberInfo = {
          name: memberForm.name.trim(),
          regNo: memberForm.regNo.trim(),
          email: memberForm.email.trim()
        }
        
        // Add to member entries list
        const newEntry: MemberEntry = {
          regNo: memberInfo.regNo,
          email: memberInfo.email,
          timestamp: new Date().toISOString(),
          password: data.password
        }
        
        setMemberEntries(prev => [newEntry, ...prev])
        calculateStats([newEntry, ...memberEntries])
        
        // Store member info for success message
        setLastAddedMember({ name: memberInfo.name, email: memberInfo.email })
        
        // Clear form
        setMemberForm({ name: '', regNo: '', email: '' })
        
        // Clear success message after 10 seconds
        setTimeout(() => {
          setMemberEntrySuccess(false)
          setGeneratedPassword('')
          setLastAddedMember(null)
        }, 10000)
      } else {
        setMemberEntryError(data.error || 'Failed to add member entry')
      }
    } catch (err) {
      setMemberEntryError('Network error. Please check your connection and try again.')
    }

    setMemberEntryLoading(false)
  }

  useEffect(() => {
    fetchMemberEntries()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl mr-3">🤖</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-sm text-gray-600">Robotics Club Door Lock System</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Logout"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 font-medium">Total Entries</p>
                <p className="text-2xl font-bold text-blue-900">{stats.totalEntries}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 font-medium">Today's Entries</p>
                <p className="text-2xl font-bold text-green-900">{stats.todayEntries}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="card bg-purple-50 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-purple-600 font-medium">Unique Members</p>
                <p className="text-2xl font-bold text-purple-900">{stats.uniqueMembers}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Member Entry Form */}
        <div className="card mb-8">
          <div className="flex items-center mb-6">
            <UserPlus className="h-6 w-6 text-blue-600 mr-3" />
            <h2 className="text-xl font-bold text-gray-900">Add New Member</h2>
          </div>

          <form onSubmit={handleMemberSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Member Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    className="input-field pl-10"
                    placeholder="John Doe"
                    value={memberForm.name}
                    onChange={handleMemberFormChange}
                  />
                </div>
              </div>

              {/* Registration Number */}
              <div>
                <label htmlFor="regNo" className="block text-sm font-medium text-gray-700 mb-2">
                  Registration Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="regNo"
                    name="regNo"
                    type="text"
                    required
                    className="input-field pl-10"
                    placeholder="REG2024001"
                    value={memberForm.regNo}
                    onChange={handleMemberFormChange}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="input-field pl-10"
                    placeholder="student@university.edu"
                    value={memberForm.email}
                    onChange={handleMemberFormChange}
                  />
                </div>
              </div>
            </div>

            {/* Error Message */}
            {memberEntryError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                {memberEntryError}
              </div>
            )}

            {/* Success Message */}
            {memberEntrySuccess && generatedPassword && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 mr-2" />
                  <span className="font-medium">Member Added Successfully!</span>
                </div>
                <p className="text-sm">
                  Access password: <span className="font-mono font-bold text-lg">{generatedPassword}</span>
                </p>
                <p className="text-sm mt-2">
                  Password has been sent to {lastAddedMember?.name} ({lastAddedMember?.email})
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={memberEntryLoading}
              className={`btn-primary flex items-center justify-center space-x-2 ${
                memberEntryLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {memberEntryLoading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <span>Add Member</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Actions */}
        <div className="card mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Admin Actions</h2>
          
          {/* Password Change with OTP */}
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              Change All Member Passwords
            </h3>
            
            {passwordChangeStep === 'initial' && (
              <div>
                <p className="text-sm text-yellow-700 mb-3">
                  This will generate new passwords for all members and send them via email. OTP verification required.
                </p>
                <button
                  onClick={initiatePasswordChange}
                  disabled={loading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Key className="h-4 w-4" />
                  )}
                  <span>Request Password Change</span>
                </button>
              </div>
            )}

            {passwordChangeStep === 'otp-sent' && (
              <div>
                <p className="text-sm text-green-700 mb-3">
                  OTP sent to admin emails. Enter the 6-digit code to confirm password change.
                </p>
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    maxLength={6}
                    className="input-field w-32 text-center text-lg tracking-widest"
                    placeholder="123456"
                    value={passwordChangeOtp}
                    onChange={(e) => setPasswordChangeOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                  <button
                    onClick={confirmPasswordChange}
                    disabled={loading || passwordChangeOtp.length !== 6}
                    className={`btn-primary flex items-center space-x-2 ${
                      loading || passwordChangeOtp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                    <span>Confirm Change</span>
                  </button>
                  <button
                    onClick={() => {
                      setPasswordChangeStep('initial')
                      setPasswordChangeOtp('')
                      setPasswordChangeError('')
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {passwordChangeStep === 'completed' && (
              <div className="flex items-center text-green-700">
                <CheckCircle className="h-5 w-5 mr-2" />
                <span className="font-medium">All passwords changed successfully!</span>
              </div>
            )}

            {passwordChangeError && (
              <div className="mt-3 bg-red-100 border border-red-400 text-red-700 px-3 py-2 rounded">
                <div className="flex items-center">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{passwordChangeError}</span>
                </div>
              </div>
            )}
          </div>

          {/* Other Actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Door OTP Generation */}
            <div className="space-y-2">
              <button
                onClick={generateDoorOtp}
                disabled={doorOtpLoading}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                {doorOtpLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <DoorOpen className="h-5 w-5" />
                )}
                <span>Generate Door OTP</span>
              </button>
              
              {doorOtpSuccess && (
                <div className="space-y-2">
                  <div className="text-xs text-green-600 flex items-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    {doorOtpSuccess}
                  </div>
                  {doorOtpCode && (
                    <div className="bg-gray-900 text-green-400 px-3 py-2 rounded font-mono text-center text-lg tracking-wider">
                      {doorOtpCode}
                    </div>
                  )}
                  {doorOtpExpiresAt && (
                    <OtpTimer 
                      expiresAt={doorOtpExpiresAt}
                      onExpired={() => {
                        setDoorOtpSuccess('')
                        setDoorOtpCode('')
                        setDoorOtpExpiresAt(null)
                      }}
                      className="justify-center text-xs"
                    />
                  )}
                </div>
              )}
              
              {doorOtpError && (
                <div className="text-xs text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {doorOtpError}
                </div>
              )}
            </div>

            {/* Export Data */}
            <button
              onClick={exportToCsv}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Download className="h-5 w-5" />
              <span>Export Data</span>
            </button>

            {/* Refresh Data */}
            <button
              onClick={fetchMemberEntries}
              disabled={loading}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh List</span>
            </button>
          </div>
        </div>

        {/* Recent Entries */}
        <div className="card">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Entries</h2>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-4">Loading entries...</p>
            </div>
          ) : memberEntries.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No member entries found</p>
              <p className="text-sm text-gray-500 mt-2">Add your first member to see entries here</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Member
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Password
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {memberEntries.map((entry, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-5 w-5 text-blue-500 mr-3" />
                          <span className="text-sm font-medium text-gray-900">{entry.regNo}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Mail className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{entry.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-600">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {entry.password}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Member Logs Table */}
        <MemberLogsTable className="mt-8" />
      </main>
    </div>
  )
}

export default Dashboard