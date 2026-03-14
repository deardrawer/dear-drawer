'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import BottomNav from '@/components/geunnal/BottomNav'
import LoginScreen from '@/components/geunnal/LoginScreen'
import PasswordChangeSheet from '@/components/geunnal/PasswordChangeSheet'
import EventManagement from '@/components/geunnal/EventManagement'
import EventDetail from '@/components/geunnal/EventDetail'
import Dashboard from '@/components/geunnal/Dashboard'
import PhotoBooth from '@/components/geunnal/PhotoBooth'
import VenuePage from '@/components/geunnal/VenuePage'

interface GeunnalClientProps {
  pageId: string
  slug: string
  groomName: string
  brideName: string
  weddingDate: string | null
  weddingTime: string | null
  venueName: string | null
  venueAddress: string | null
  hasPassword: boolean
  ogImage?: string
}

type ActiveView =
  | { type: 'home' }
  | { type: 'photobooth' }
  | { type: 'dashboard' }
  | { type: 'venues' }
  | { type: 'event-detail'; eventId: string }

export default function GeunnalClient({
  pageId,
  slug,
  groomName,
  brideName,
  weddingDate,
  hasPassword: initialHasPassword,
  ogImage,
}: GeunnalClientProps) {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [hasPassword, setHasPassword] = useState(initialHasPassword)
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const scrollPositionRef = useRef<number>(0)

  // Mobile keyboard: scroll focused input to top of viewport
  useEffect(() => {
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        // Skip PIN inputs (single digit) - they handle their own focus
        if (target.getAttribute('maxLength') === '1') return

        // Wait for keyboard to open
        setTimeout(() => {
          target.scrollIntoView({ block: 'start', behavior: 'smooth' })
        }, 300)
      }
    }

    document.addEventListener('focusin', handleFocusIn)
    return () => document.removeEventListener('focusin', handleFocusIn)
  }, [])

  // Check saved token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem(`geunnal-token-${pageId}`)
    if (savedToken) {
      // Verify token is still valid
      fetch(`/api/geunnal/${pageId}/auth`, {
        headers: { 'Authorization': `Bearer ${savedToken}` },
      })
        .then(res => {
          if (res.ok) {
            setToken(savedToken)
            setIsAuthenticated(true)
          } else {
            localStorage.removeItem(`geunnal-token-${pageId}`)
          }
        })
        .catch(() => {
          localStorage.removeItem(`geunnal-token-${pageId}`)
        })
        .finally(() => setCheckingAuth(false))
    } else {
      // No saved token - show login or setup screen
      setCheckingAuth(false)
    }
  }, [pageId])

  const handleLoginSuccess = useCallback((newToken: string) => {
    localStorage.setItem(`geunnal-token-${pageId}`, newToken)
    setToken(newToken)
    setIsAuthenticated(true)
    setHasPassword(true) // After setup, password now exists
  }, [pageId])

  const handlePasswordChanged = useCallback((newToken: string) => {
    setToken(newToken)
  }, [])

  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'home') setActiveView({ type: 'home' })
    else if (tab === 'photobooth') setActiveView({ type: 'photobooth' })
    else if (tab === 'dashboard') setActiveView({ type: 'dashboard' })
    else if (tab === 'venues') setActiveView({ type: 'venues' })
  }, [])

  const handleEventClick = useCallback((eventId: string) => {
    scrollPositionRef.current = window.scrollY
    setActiveView({ type: 'event-detail', eventId })
    window.scrollTo(0, 0)
  }, [])

  const handleBackToHome = useCallback(() => {
    setActiveView({ type: 'home' })
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPositionRef.current)
    })
  }, [])

  // Loading state
  if (checkingAuth) {
    return (
      <div className="geunnal-page flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#8B75D0] border-t-transparent rounded-full animate-spin" />
          <p className="text-[14px] text-[#9B8CC4]">로딩 중...</p>
        </div>
      </div>
    )
  }

  // Login or Setup screen
  if (!isAuthenticated) {
    return (
      <div className="geunnal-page">
        <LoginScreen
          pageId={pageId}
          groomName={groomName}
          brideName={brideName}
          mode={hasPassword ? 'login' : 'setup'}
          onLoginSuccess={handleLoginSuccess}
        />
      </div>
    )
  }

  const currentTab =
    activeView.type === 'event-detail' ? 'home' : activeView.type === 'home' ? 'home' : activeView.type

  return (
    <div className="geunnal-page">
      {/* Main Content */}
      <div className="min-h-[100dvh] pb-20">
        {activeView.type === 'home' && (
          <EventManagement
            pageId={pageId}
            token={token || ''}
            groomName={groomName}
            brideName={brideName}
            weddingDate={weddingDate}
            onEventClick={handleEventClick}
            onPasswordChange={() => setShowPasswordChange(true)}
          />
        )}

        {activeView.type === 'event-detail' && (
          <EventDetail
            eventId={activeView.eventId}
            pageId={pageId}
            token={token || ''}
            onBack={handleBackToHome}
            slug={slug}
            ogImage={ogImage}
          />
        )}

        {activeView.type === 'photobooth' && (
          <PhotoBooth
            pageId={pageId}
            token={token || ''}
            groomName={groomName}
            brideName={brideName}
          />
        )}

        {activeView.type === 'dashboard' && (
          <Dashboard
            pageId={pageId}
            token={token || ''}
          />
        )}

        {activeView.type === 'venues' && (
          <VenuePage
            pageId={pageId}
            token={token || ''}
          />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={currentTab}
        onTabChange={handleTabChange}
      />

      {/* Password Change Sheet */}
      <PasswordChangeSheet
        open={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        pageId={pageId}
        onPasswordChanged={handlePasswordChanged}
      />
    </div>
  )
}
