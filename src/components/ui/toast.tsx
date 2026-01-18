'use client'

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ============================================================
// Types
// ============================================================

type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  message: string
  type: ToastType
  duration?: number
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
  useEffect(() => {
    const timer = setTimeout(onClose, toast.duration || 3000)
    return () => clearTimeout(timer)
  }, [toast.duration, onClose])

  const config = {
    success: {
      bg: 'bg-green-500',
      icon: '✓',
      iconBg: 'bg-green-600'
    },
    error: {
      bg: 'bg-red-500',
      icon: '✕',
      iconBg: 'bg-red-600'
    },
    info: {
      bg: 'bg-blue-500',
      icon: 'ℹ',
      iconBg: 'bg-blue-600'
    },
    warning: {
      bg: 'bg-amber-500',
      icon: '⚠',
      iconBg: 'bg-amber-600'
    }
  }[toast.type]

  return (
    <div
      className={`${config.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[280px] max-w-[400px] animate-slide-up`}
      role="alert"
      aria-live="polite"
    >
      <span
        className={`${config.iconBg} w-6 h-6 rounded-full flex items-center justify-center text-sm flex-shrink-0`}
      >
        {config.icon}
      </span>
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        onClick={onClose}
        className="text-white/70 hover:text-white transition-colors p-1"
        aria-label="닫기"
      >
        ✕
      </button>
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
    <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </div>,
    document.body
  )
}

// ============================================================
// Toast Context
// ============================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export function ToastProvider({ children }: { children: ReactNode }) {
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
// useToast Hook
// ============================================================

export function useToast() {
  const context = useContext(ToastContext)

  // 컨텍스트 없이도 동작하도록 fallback 제공
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
    () =>
      !context ? (
        <ToastContainer toasts={toasts} removeToast={removeToast} />
      ) : null,
    [context, toasts, removeToast]
  )

  return {
    showToast,
    ToastContainer: ToastContainerComponent
  }
}

// ============================================================
// Standalone Toast Component (for backward compatibility)
// ============================================================

interface StandaloneToastProps {
  message: string
  type?: ToastType
  duration?: number
  onClose: () => void
}

export function Toast({
  message,
  type = 'info',
  duration = 3000,
  onClose
}: StandaloneToastProps) {
  return (
    <ToastItem toast={{ id: Date.now(), message, type, duration }} onClose={onClose} />
  )
}

export default Toast
