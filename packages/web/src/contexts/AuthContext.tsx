import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { auth, type MeResponse, ApiError } from '../services/api'

interface User {
  id: string
  nome: string
  email: string
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const navigate = useNavigate()
  const location = useLocation()

  const checkAuth = useCallback(async () => {
    try {
      const response: MeResponse = await auth.me()
      setUser(response.user)
    } catch (error) {
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const response = await auth.login({ email, password })
    setUser(response.user)
    const from = (location.state as { from?: string })?.from || '/dashboard'
    navigate(from, { replace: true })
  }

  const logout = async () => {
    try {
      await auth.logout()
    } catch (error) {
      if (error instanceof ApiError && error.status !== 401) {
        console.error('Logout error:', error)
      }
    } finally {
      setUser(null)
      navigate('/login', { replace: true })
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
