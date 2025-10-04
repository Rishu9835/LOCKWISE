import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: string
  name: string
  email: string
}

interface AuthContextType {
  user: User | null
  sendOtp: (email: string) => Promise<{ success: boolean; expiresAt?: number; validityMinutes?: number }>
  verifyOtp: (email: string, otp: string) => Promise<boolean>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)

  // Check for saved user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
  }, [])

  const sendOtp = async (email: string): Promise<{ success: boolean; expiresAt?: number; validityMinutes?: number }> => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/verifyAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      if (response.ok) {
        const data = await response.json()
        setLoading(false)
        return { 
          success: true, 
          expiresAt: data.expiresAt, 
          validityMinutes: data.validityMinutes 
        }
      } else {
        const errorText = await response.text()
        console.error('Send OTP error:', errorText)
        setLoading(false)
        return { success: false }
      }
    } catch (error) {
      console.error('Send OTP error:', error)
      setLoading(false)
      return { success: false }
    }
  }

  const verifyOtp = async (email: string, otp: string): Promise<boolean> => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3000/verifyAdmin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, otp })
      })

      if (response.ok) {
        const userData: User = {
          id: '1',
          name: 'Admin',
          email: email
        }
        
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
        setLoading(false)
        return true
      } else {
        setLoading(false)
        return false
      }
    } catch (error) {
      console.error('Verify OTP error:', error)
      setLoading(false)
      return false
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('user')
  }

  const contextValue: AuthContextType = {
    user,
    sendOtp,
    verifyOtp,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}