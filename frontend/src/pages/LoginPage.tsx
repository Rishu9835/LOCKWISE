import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Shield, LogIn, Send } from 'lucide-react'
import OtpTimer from '../components/OtpTimer'

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otpExpiresAt, setOtpExpiresAt] = useState<number | null>(null)

  const { sendOtp, verifyOtp } = useAuth()
  const navigate = useNavigate()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await sendOtp(email)
      if (result.success) {
        setOtpSent(true)
        setOtpExpiresAt(result.expiresAt || null)
        setError('')
      } else {
        setError('You are not authorized as an admin or email not found in system')
      }
    } catch (err) {
      setError('Failed to send OTP. Please check your connection.')
    }

    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const success = await verifyOtp(email, otp)
      if (success) {
        navigate('/')
      } else {
        setError('Invalid OTP. Please try again.')
      }
    } catch (err) {
      setError('An error occurred during verification')
    }

    setLoading(false)
  }

  const resetForm = () => {
    setOtpSent(false)
    setOtp('')
    setError('')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="text-6xl mb-4">🤖</div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Admin Login
          </h2>
          <p className="text-gray-600">
            {otpSent ? 'Enter the OTP sent to your email' : 'Enter your admin email to receive OTP'}
          </p>
        </div>

        {/* Login Form */}
        <div className="card">
          {!otpSent ? (
            // Step 1: Email Input
            <form className="space-y-6" onSubmit={handleSendOtp}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Email Address
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
                    placeholder="admin@robotics.club"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Admin Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-blue-800 mb-2">Admin Access:</h4>
                <p className="text-sm text-blue-700">
                  Only authorized admin emails from the system database can request OTP
                </p>
                <p className="text-xs text-blue-600 mt-2">
                  Contact system administrator if you don't have access
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className={`w-full btn-primary flex items-center justify-center space-x-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    <span>Send OTP</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            // Step 2: OTP Verification
            <form className="space-y-6" onSubmit={handleVerifyOtp}>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Email Display */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 text-gray-500 mr-2" />
                  <span className="text-sm text-gray-700">{email}</span>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="ml-auto text-sm text-blue-600 hover:text-blue-500"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* OTP Field */}
              <div>
                <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-2">
                  One-Time Password (OTP)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="otp"
                    name="otp"
                    type="text"
                    required
                    maxLength={6}
                    className="input-field pl-10 text-center text-lg tracking-widest"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  />
                </div>
              </div>

              {/* OTP Info */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Check Your Email:</h4>
                <p className="text-sm text-green-700">
                  A 6-digit OTP has been sent to your email address
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Check your spam folder if you don't see it.
                </p>
                {/* OTP Timer */}
                {otpExpiresAt && (
                  <div className="mt-3 pt-3 border-t border-green-200">
                    <OtpTimer 
                      expiresAt={otpExpiresAt} 
                      onExpired={() => {
                        setOtpSent(false)
                        setOtp('')
                        setError('OTP has expired. Please request a new one.')
                      }}
                      className="justify-center"
                    />
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || otp.length !== 6}
                className={`w-full btn-primary flex items-center justify-center space-x-2 ${
                  loading || otp.length !== 6 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Verify & Login</span>
                  </>
                )}
              </button>

              {/* Resend OTP */}
              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  className="text-sm text-blue-600 hover:text-blue-500 transition-colors"
                >
                  Resend OTP
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

export default LoginPage