'use client'

import { cn } from '@/lib/utils'

// ============================================================
// Types
// ============================================================

interface ProgressStepsProps {
  current: number
  total: number
  labels?: string[]
  className?: string
}

interface StepItemProps {
  index: number
  label?: string
  isActive: boolean
  isCompleted: boolean
  isLast: boolean
}

// ============================================================
// Step Item Component
// ============================================================

function StepItem({ index, label, isActive, isCompleted, isLast }: StepItemProps) {
  return (
    <div className="flex items-center">
      <div className="flex flex-col items-center">
        {/* Step Circle */}
        <div
          className={cn(
            'w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-medium transition-all duration-300',
            isCompleted
              ? 'bg-rose-500 text-white'
              : isActive
              ? 'bg-rose-500 text-white ring-4 ring-rose-200'
              : 'bg-gray-200 text-gray-500'
          )}
        >
          {isCompleted ? (
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          ) : (
            index + 1
          )}
        </div>

        {/* Step Label */}
        {label && (
          <span
            className={cn(
              'mt-2 text-xs sm:text-sm font-medium text-center max-w-[60px] sm:max-w-[80px] leading-tight',
              isActive || isCompleted ? 'text-rose-600' : 'text-gray-400'
            )}
          >
            {label}
          </span>
        )}
      </div>

      {/* Connector Line */}
      {!isLast && (
        <div
          className={cn(
            'w-8 sm:w-16 md:w-24 h-0.5 mx-1 sm:mx-2 transition-all duration-300',
            isCompleted ? 'bg-rose-500' : 'bg-gray-200'
          )}
        />
      )}
    </div>
  )
}

// ============================================================
// Progress Steps Component
// ============================================================

export function ProgressSteps({
  current,
  total,
  labels,
  className
}: ProgressStepsProps) {
  const percentage = ((current - 1) / (total - 1)) * 100

  return (
    <div className={cn('w-full', className)}>
      {/* Steps */}
      <div className="flex items-start justify-center">
        {Array.from({ length: total }).map((_, index) => (
          <StepItem
            key={index}
            index={index}
            label={labels?.[index]}
            isActive={index + 1 === current}
            isCompleted={index + 1 < current}
            isLast={index === total - 1}
          />
        ))}
      </div>

      {/* Progress Bar (Optional - for mobile) */}
      <div className="mt-4 sm:hidden">
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-rose-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-center">
          {current} / {total} 단계
        </p>
      </div>
    </div>
  )
}

// ============================================================
// Simple Progress Bar Component
// ============================================================

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function ProgressBar({
  value,
  max = 100,
  showLabel = false,
  className,
  size = 'md'
}: ProgressBarProps) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const heightClass = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  }[size]

  return (
    <div className={cn('w-full', className)}>
      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heightClass)}>
        <div
          className={cn('bg-rose-500 rounded-full transition-all duration-500', heightClass)}
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showLabel && (
        <p className="text-xs text-gray-500 mt-1 text-right">{Math.round(percentage)}%</p>
      )}
    </div>
  )
}

export default ProgressSteps
