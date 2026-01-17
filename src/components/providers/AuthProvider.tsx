'use client'

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react'
import { usePathname } from 'next/navigation'

interface User {
  id: string
  kakaoId: number
  nickname: string
  email?: string
  profileImage?: string
}

interface AuthContextType {
  user: User | null
  status: 'loading' | 'authenticated' | 'unauthenticated'
  logout: () => Promise<void>
  refreshAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading')
  const pathname = usePathname()

  // /i 경로(청첩장 뷰어)에서는 인증 체크 건너뛰기
  const isInvitationPage = pathname?.startsWith('/i/')

  const refreshAuth = useCallback(async () => {
    // 청첩장 뷰어 페이지에서는 auth 체크 생략
    if (isInvitationPage) {
      setStatus('unauthenticated')
      return
    }

    try {
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data: { user?: User } = await response.json()
        setUser(data.user || null)
        setStatus('authenticated')
      } else {
        setUser(null)
        setStatus('unauthenticated')
      }
    } catch (error) {
      console.error('Auth check error:', error)
      setUser(null)
      setStatus('unauthenticated')
    }
  }, [isInvitationPage])

  useEffect(() => {
    refreshAuth()
  }, [refreshAuth])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      setUser(null)
      setStatus('unauthenticated')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <AuthContext.Provider value={{ user, status, logout, refreshAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
