'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface HelpTooltipProps {
  content: string | ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
  iconClassName?: string
}

interface TooltipProps {
  content: string | ReactNode
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
  className?: string
}

// ============================================================
// Help Tooltip Component (Question mark icon)
// ============================================================

export function HelpTooltip({
  content,
  position = 'top',
  className,
  iconClassName
}: HelpTooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const tooltipRef = useRef<HTMLDivElement>(null)

  // 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent'
  }

  return (
    <div ref={tooltipRef} className={cn('relative inline-flex items-center', className)}>
      <button
        type="button"
        className={cn(
          'text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-rose-300 rounded-full transition-colors',
          iconClassName
        )}
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="도움말"
        aria-expanded={isOpen}
      >
        <svg
          className="w-4 h-4"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 animate-fade-in',
            positionClasses[position]
          )}
          role="tooltip"
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg py-2 px-3 max-w-xs shadow-lg">
            {content}
          </div>
          <div
            className={cn(
              'absolute border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// Generic Tooltip Component
// ============================================================

export function Tooltip({
  content,
  children,
  position = 'top',
  delay = 200,
  className
}: TooltipProps) {
  const [isOpen, setIsOpen] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleMouseEnter = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsOpen(false)
  }

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-gray-800 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-800 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-gray-800 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-gray-800 border-y-transparent border-l-transparent'
  }

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {isOpen && (
        <div
          className={cn(
            'absolute z-50 pointer-events-none animate-fade-in',
            positionClasses[position]
          )}
          role="tooltip"
        >
          <div className="bg-gray-800 text-white text-sm rounded-lg py-2 px-3 max-w-xs shadow-lg whitespace-nowrap">
            {content}
          </div>
          <div
            className={cn(
              'absolute border-4',
              arrowClasses[position]
            )}
          />
        </div>
      )}
    </div>
  )
}

// ============================================================
// Info Label Component
// ============================================================

interface InfoLabelProps {
  label: string
  help: string
  required?: boolean
  className?: string
}

export function InfoLabel({ label, help, required, className }: InfoLabelProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      <span className="text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      <HelpTooltip content={help} />
    </div>
  )
}

export default HelpTooltip
