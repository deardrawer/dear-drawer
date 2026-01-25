'use client'

import { useEffect, useCallback, ReactNode } from 'react'
import { createPortal } from 'react-dom'

// ============================================================
// Types
// ============================================================

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
  closeOnEsc?: boolean
  position?: 'center' | 'bottom'
  maxWidth?: string
  className?: string
}

// ============================================================
// Modal Component
// ============================================================

export function Modal({
  isOpen,
  onClose,
  children,
  title,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  position = 'bottom',
  maxWidth = '480px',
  className = '',
}: ModalProps) {
  // ESC 키로 닫기
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (closeOnEsc && e.key === 'Escape') {
        onClose()
      }
    },
    [closeOnEsc, onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, handleKeyDown])

  if (!isOpen) return null

  const modalContent = (
    <div
      className="fixed inset-0 z-50 flex"
      style={{
        alignItems: position === 'center' ? 'center' : 'flex-end',
        justifyContent: 'center',
      }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-300"
        onClick={closeOnOverlayClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Content */}
      <div
        className={`relative w-full bg-white shadow-xl transition-all duration-300 ${className}`}
        style={{
          maxWidth,
          borderRadius: position === 'center' ? '16px' : '16px 16px 0 0',
          maxHeight: position === 'center' ? '90vh' : '85vh',
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div
            className="flex items-center justify-between px-6 py-4"
            style={{ borderBottom: '1px solid #E8E4DD' }}
          >
            {title && (
              <h2
                id="modal-title"
                className="text-lg font-semibold"
                style={{ color: '#2C2C2C' }}
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
                style={{ backgroundColor: '#F5F3EE', color: '#666' }}
                aria-label="닫기"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </div>
        )}

        {/* Body */}
        <div
          className="overflow-y-auto"
          style={{
            maxHeight: title || showCloseButton ? 'calc(85vh - 60px)' : '85vh',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )

  // Portal to document.body
  if (typeof document === 'undefined') return null
  return createPortal(modalContent, document.body)
}

// ============================================================
// Modal Header Component
// ============================================================

interface ModalHeaderProps {
  children: ReactNode
  className?: string
}

export function ModalHeader({ children, className = '' }: ModalHeaderProps) {
  return (
    <div
      className={`px-6 py-4 ${className}`}
      style={{ borderBottom: '1px solid #E8E4DD' }}
    >
      {children}
    </div>
  )
}

// ============================================================
// Modal Body Component
// ============================================================

interface ModalBodyProps {
  children: ReactNode
  className?: string
}

export function ModalBody({ children, className = '' }: ModalBodyProps) {
  return <div className={`px-6 py-4 ${className}`}>{children}</div>
}

// ============================================================
// Modal Footer Component
// ============================================================

interface ModalFooterProps {
  children: ReactNode
  className?: string
}

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div
      className={`px-6 py-4 ${className}`}
      style={{
        borderTop: '1px solid #E8E4DD',
        paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
      }}
    >
      {children}
    </div>
  )
}

// ============================================================
// Confirm Modal Component
// ============================================================

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'default'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = '확인',
  message,
  confirmText = '확인',
  cancelText = '취소',
  variant = 'default',
}: ConfirmModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} position="center" maxWidth="360px" showCloseButton={false}>
      <div className="p-6 text-center">
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#2C2C2C' }}>
          {title}
        </h3>
        <p className="text-sm mb-6" style={{ color: '#666' }}>
          {message}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl text-sm font-medium"
            style={{ backgroundColor: '#F5F3EE', color: '#666' }}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white"
            style={{
              backgroundColor: variant === 'danger' ? '#DC2626' : '#C9A962',
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default Modal
