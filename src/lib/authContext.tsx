import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface AuthUser {
  name:         string
  email:        string
  policyNumber: string
  customerId:   string
  lob:          string[]   // which LOBs this customer has
  phone:        string
}

interface AuthContextType {
  user:            AuthUser | null
  isAuthenticated: boolean
  isLoading:       boolean
  login:           (email: string, password: string) => Promise<void>
  logout:          () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

const STORAGE_KEY = 'vm_portal_auth'

// ─── Mock user — replace with real identity provider response ──────
const MOCK_USER: AuthUser = {
  name:         'Sarah M. Johnson',
  email:        'sarah.johnson@email.com',
  policyNumber: 'VM-AUTO-2024-88421',
  customerId:   'CUST-88421',
  lob:          ['auto', 'home'],
  phone:        '(214) 555-0188',
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user,      setUser]      = useState<AuthUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Restore session on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setUser(JSON.parse(stored))
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, _password: string) => {
    // ── TODO: Replace with real auth call ──────────────────────────
    // Example Okta: const tokens = await oktaAuth.signInWithCredentials(...)
    // Example Auth0: const result = await auth0.loginWithCredentials(...)
    // ──────────────────────────────────────────────────────────────
    await new Promise(r => setTimeout(r, 1200)) // simulate network
    if (!email) throw new Error('Invalid credentials')
    const loggedInUser = { ...MOCK_USER, email }
    setUser(loggedInUser)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
    // TODO: oktaAuth.signOut() or auth0.logout()
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
