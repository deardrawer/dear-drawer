'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ============================================================
// Types
// ============================================================

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration: number
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
}

// ============================================================
// Toast Item Component
// ============================================================

interface ToastItemProps {
  toast: Toast
  onClose: () => void
}

function ToastItem({ toast, onClose }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    // 마운트 시 애니메이션
    requestAnimationFrame(() => setIsVisible(true))

    // 자동 닫기
    const hideTimer = setTimeout(() => {
      setIsExiting(true)
      setTimeout(onClose, 300)
    }, toast.duration - 300)

    return () => clearTimeout(hideTimer)
  }, [toast.duration, onClose])

  const config = {
    success: {
      bg: '#2C2C2C',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
    error: {
      bg: '#2C2C2C',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="15" y1="9" x2="9" y2="15" />
          <line x1="9" y1="9" x2="15" y2="15" />
        </svg>
      ),
    },
    info: {
      bg: '#2C2C2C',
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C9A962" strokeWidth="2.5">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
    },
  }[toast.type]

  return (
    <div
      className="transition-all duration-300 ease-out"
      style={{
        opacity: isVisible && !isExiting ? 1 : 0,
        transform: `translateX(-50%) translateY(${isVisible && !isExiting ? 0 : 20}px)`,
      }}
      role="alert"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-full shadow-lg"
        style={{
          backgroundColor: config.bg,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        }}
      >
        <span className="flex-shrink-0">{config.icon}</span>
        <span className="text-sm font-medium text-white">{toast.message}</span>
      </div>
    </div>
  )
}

// ============================================================
// Toast Container Component
// ============================================================

interface ToastContainerProps {
  toasts: Toast[]
  removeToast: (id: number) => void
}

function ToastContainer({ toasts, removeToast }: ToastContainerProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] flex flex-col-reverse gap-2"
      style={{ pointerEvents: 'none' }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  )
}

// ============================================================
// Toast Context
// ============================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function AdminToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      const id = Date.now()
      setToasts((prev) => [...prev, { id, message, type, duration }])
    },
    []
  )

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

// ============================================================
// useAdminToast Hook
// ============================================================

export function useAdminToast() {
  const context = useContext(ToastContext)

  // Fallback for usage without provider
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000) => {
      if (context) {
        context.showToast(message, type, duration)
      } else {
        const id = Date.now()
        setToasts((prev) => [...prev, { id, message, type, duration }])
      }
    },
    [context]
  )

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const ToastContainerComponent = useCallback(
    () => (!context ? <ToastContainer toasts={toasts} removeToast={removeToast} /> : null),
    [context, toasts, removeToast]
  )

  return {
    showToast,
    success: (message: string, duration?: number) => showToast(message, 'success', duration),
    error: (message: string, duration?: number) => showToast(message, 'error', duration),
    info: (message: string, duration?: number) => showToast(message, 'info', duration),
    ToastContainer: ToastContainerComponent,
  }
}

// ============================================================
// Standalone Toast Component
// ============================================================

interface AdminToastProps {
  message: string
  type?: ToastType
  isVisible: boolean
}

export function AdminToast({ message, type = 'info', isVisible }: AdminToastProps) {
  const config = {
    success: { icon: '✓', color: '#4CAF50' },
    error: { icon: '✕', color: '#EF4444' },
    info: { icon: '✓', color: '#C9A962' },
  }[type]

  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 z-50"
      style={{
        backgroundColor: '#2C2C2C',
        color: '#FFF',
        opacity: isVisible ? 1 : 0,
        transform: `translateX(-50%) translateY(${isVisible ? 0 : 20}px)`,
        pointerEvents: isVisible ? 'auto' : 'none',
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
    >
      <span style={{ color: config.color, marginRight: '8px' }}>{config.icon}</span>
      {message}
    </div>
  )
}

export default AdminToast
