'use client'

import { useState, useEffect, useCallback } from 'react'
import BottomNav from '@/components/geunnal/BottomNav'
import LoginScreen from '@/components/geunnal/LoginScreen'
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
  hasPassword,
}: GeunnalClientProps) {
  const [token, setToken] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [checkingAuth, setCheckingAuth] = useState(true)
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' })

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
    } else if (!hasPassword) {
      // No password set, no auth needed
      setIsAuthenticated(true)
      setCheckingAuth(false)
    } else {
      setCheckingAuth(false)
    }
  }, [pageId, hasPassword])

  const handleLoginSuccess = useCallback((newToken: string) => {
    localStorage.setItem(`geunnal-token-${pageId}`, newToken)
    setToken(newToken)
    setIsAuthenticated(true)
  }, [pageId])

  const handleTabChange = useCallback((tab: string) => {
    if (tab === 'home') setActiveView({ type: 'home' })
    else if (tab === 'photobooth') setActiveView({ type: 'photobooth' })
    else if (tab === 'dashboard') setActiveView({ type: 'dashboard' })
    else if (tab === 'venues') setActiveView({ type: 'venues' })
  }, [])

  const handleEventClick = useCallback((eventId: string) => {
    setActiveView({ type: 'event-detail', eventId })
  }, [])

  const handleBackToHome = useCallback(() => {
    setActiveView({ type: 'home' })
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

  // Login screen
  if (hasPassword && !isAuthenticated) {
    return (
      <div className="geunnal-page">
        <LoginScreen
          pageId={pageId}
          groomName={groomName}
          brideName={brideName}
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
          />
        )}

        {activeView.type === 'event-detail' && (
          <EventDetail
            eventId={activeView.eventId}
            pageId={pageId}
            token={token || ''}
            onBack={handleBackToHome}
            slug={slug}
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
    </div>
  )
}
