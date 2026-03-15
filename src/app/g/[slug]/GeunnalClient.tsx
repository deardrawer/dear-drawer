'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import BottomNav from '@/components/geunnal/BottomNav'
import LoginScreen from '@/components/geunnal/LoginScreen'
import PasswordChangeSheet from '@/components/geunnal/PasswordChangeSheet'
import NotificationSheet from '@/components/geunnal/NotificationSheet'
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
  | { type: 'event-detail'; eventId: string; returnTo: 'home' | 'dashboard' }

const VALID_TABS = new Set(['home', 'photobooth', 'dashboard', 'venues'])

function parseHash(hash: string): ActiveView {
  const h = hash.replace('#', '')
  if (!h || h === 'home') return { type: 'home' }
  if (h.startsWith('event/')) {
    const eventId = h.slice(6)
    if (eventId) return { type: 'event-detail', eventId, returnTo: 'home' }
  }
  if (VALID_TABS.has(h)) return { type: h } as ActiveView
  return { type: 'home' }
}

function viewToHash(view: ActiveView): string {
  if (view.type === 'home') return ''
  if (view.type === 'event-detail') return `#event/${view.eventId}`
  return `#${view.type}`
}

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
  const [activeView, setActiveView] = useState<ActiveView>(() => {
    if (typeof window === 'undefined') return { type: 'home' }
    return parseHash(window.location.hash)
  })
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showNotificationEdit, setShowNotificationEdit] = useState(false)
  const [showExitToast, setShowExitToast] = useState(false)
  const scrollPositionRef = useRef<number>(0)
  const skipNextPush = useRef(false)
  const backPressedOnce = useRef(false)
  const backTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Sync activeView → URL hash (push history)
  useEffect(() => {
    if (skipNextPush.current) {
      skipNextPush.current = false
      return
    }
    const newHash = viewToHash(activeView)
    const currentHash = window.location.hash
    if (newHash !== currentHash) {
      window.history.pushState(null, '', newHash || window.location.pathname)
    }
  }, [activeView])

  // Listen for browser back/forward (popstate) with double-back exit
  useEffect(() => {
    const handlePopState = () => {
      const parsed = parseHash(window.location.hash)

      // If we're already on home and hash is empty → user is trying to exit
      if (parsed.type === 'home' && activeView.type === 'home') {
        if (backPressedOnce.current) {
          // Second press within 2s → allow exit
          return
        }
        // First press → block exit, show toast
        backPressedOnce.current = true
        setShowExitToast(true)
        window.history.pushState(null, '', window.location.pathname)
        if (backTimerRef.current) clearTimeout(backTimerRef.current)
        backTimerRef.current = setTimeout(() => {
          backPressedOnce.current = false
          setShowExitToast(false)
        }, 2000)
        return
      }

      skipNextPush.current = true
      setActiveView(parsed)
    }
    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
      if (backTimerRef.current) clearTimeout(backTimerRef.current)
    }
  }, [activeView])

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

  const handleEventClick = useCallback((eventId: string, returnTo: 'home' | 'dashboard' = 'home') => {
    scrollPositionRef.current = window.scrollY
    setActiveView({ type: 'event-detail', eventId, returnTo })
    window.scrollTo(0, 0)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem(`geunnal-token-${pageId}`)
    setToken(null)
    setIsAuthenticated(false)
  }, [pageId])

  const handleBackFromDetail = useCallback(() => {
    setActiveView(prev =>
      prev.type === 'event-detail' ? { type: prev.returnTo } : { type: 'home' }
    )
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
    activeView.type === 'event-detail' ? activeView.returnTo : activeView.type

  return (
    <div className="geunnal-page">
      {/* Main Content */}
      <div className="min-h-[100dvh] pb-20">
        {activeView.type === 'home' && (
          <EventManagement
            pageId={pageId}
            token={token || ''}
            slug={slug}
            groomName={groomName}
            brideName={brideName}
            weddingDate={weddingDate}
            onEventClick={handleEventClick}
            onPasswordChange={() => setShowPasswordChange(true)}
            onNotificationEdit={() => setShowNotificationEdit(true)}
            onLogout={handleLogout}
          />
        )}

        {activeView.type === 'event-detail' && (
          <EventDetail
            eventId={activeView.eventId}
            pageId={pageId}
            token={token || ''}
            onBack={handleBackFromDetail}
            slug={slug}
            ogImage={ogImage}
          />
        )}

        {activeView.type === 'photobooth' && (
          <PhotoBooth
            pageId={pageId}
            token={token || ''}
            slug={slug}
            groomName={groomName}
            brideName={brideName}
          />
        )}

        {activeView.type === 'dashboard' && (
          <Dashboard
            pageId={pageId}
            token={token || ''}
            onEventClick={(eventId) => handleEventClick(eventId, 'dashboard')}
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

      {/* Exit Toast */}
      {showExitToast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-full bg-[#2A2240]/85 text-white text-[13px] font-medium shadow-lg animate-fade-in whitespace-nowrap">
          뒤로 버튼을 한 번 더 누르면 종료됩니다
        </div>
      )}

      {/* Password Change Sheet */}
      <PasswordChangeSheet
        open={showPasswordChange}
        onClose={() => setShowPasswordChange(false)}
        pageId={pageId}
        onPasswordChanged={handlePasswordChanged}
      />

      {/* Notification Edit Sheet */}
      <NotificationSheet
        open={showNotificationEdit}
        onClose={() => setShowNotificationEdit(false)}
        pageId={pageId}
      />
    </div>
  )
}
