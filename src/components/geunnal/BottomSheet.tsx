'use client'
import { ReactNode, useEffect, useRef, useState } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [sheetHeight, setSheetHeight] = useState('85dvh')

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])

  // Adjust sheet height when mobile keyboard opens/closes
  useEffect(() => {
    if (!open) return

    const vv = window.visualViewport
    if (!vv) return

    const handleResize = () => {
      // When keyboard opens, visualViewport.height shrinks
      const viewportHeight = vv.height
      // Use 95% of visible viewport so content has room
      const maxHeight = Math.floor(viewportHeight * 0.92)
      setSheetHeight(`${maxHeight}px`)

      // Scroll focused input into view within the sheet
      const active = document.activeElement as HTMLElement | null
      if (
        active &&
        contentRef.current?.contains(active) &&
        (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA')
      ) {
        // Skip single-digit PIN inputs
        if (active.getAttribute('maxLength') !== '1') {
          setTimeout(() => {
            active.scrollIntoView({ block: 'start', behavior: 'smooth' })
          }, 100)
        }
      }
    }

    vv.addEventListener('resize', handleResize)
    // Set initial height
    handleResize()

    return () => vv.removeEventListener('resize', handleResize)
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={`relative w-full max-w-[430px] bg-white rounded-t-3xl shadow-lg transition-all duration-300 ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: sheetHeight }}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-[#E8E4F0] rounded-full" />
        </div>

        {/* Title */}
        {title && (
          <div className="px-6 py-3 border-b border-[#E8E4F0]">
            <h3 className="text-lg font-semibold text-[#2A2240]">{title}</h3>
          </div>
        )}

        {/* Content */}
        <div
          ref={contentRef}
          className="overflow-y-auto px-6 py-4"
          style={{ maxHeight: `calc(${sheetHeight} - 80px)` }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
