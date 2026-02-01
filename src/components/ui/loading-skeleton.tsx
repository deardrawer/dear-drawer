'use client'

import { cn } from '@/lib/utils'

// ============================================================
// Base Skeleton Component
// ============================================================

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200 rounded',
        className
      )}
    />
  )
}

// ============================================================
// Text Skeleton
// ============================================================

interface TextSkeletonProps {
  lines?: number
  className?: string
}

export function TextSkeleton({ lines = 3, className }: TextSkeletonProps) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            'h-4',
            index === lines - 1 ? 'w-2/3' : 'w-full'
          )}
        />
      ))}
    </div>
  )
}

// ============================================================
// Card Skeleton
// ============================================================

interface CardSkeletonProps {
  showHeader?: boolean
  showActions?: boolean
  lines?: number
  className?: string
}

export function CardSkeleton({
  showHeader = true,
  showActions = true,
  lines = 4,
  className
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        'border border-gray-200 rounded-lg p-6 bg-white',
        className
      )}
    >
      {/* Header */}
      {showHeader && (
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
          {showActions && (
            <div className="flex gap-2">
              <Skeleton className="h-8 w-16 rounded" />
              <Skeleton className="h-8 w-20 rounded" />
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <TextSkeleton lines={lines} />
    </div>
  )
}

// ============================================================
// Form Field Skeleton
// ============================================================

interface FormFieldSkeletonProps {
  className?: string
}

export function FormFieldSkeleton({ className }: FormFieldSkeletonProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-10 w-full rounded-md" />
    </div>
  )
}

// ============================================================
// Form Skeleton
// ============================================================

interface FormSkeletonProps {
  fields?: number
  className?: string
}

export function FormSkeleton({ fields = 4, className }: FormSkeletonProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {Array.from({ length: fields }).map((_, index) => (
        <FormFieldSkeleton key={index} />
      ))}
      <Skeleton className="h-10 w-full rounded-md mt-8" />
    </div>
  )
}

// ============================================================
// Interview Skeleton
// ============================================================

export function InterviewSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="border-l-4 border-gray-200 pl-4 py-3">
          <Skeleton className="h-5 w-3/4 mb-3" />
          <div className="space-y-2 pl-4">
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="w-6 h-6 rounded-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ============================================================
// Result Viewer Skeleton
// ============================================================

export function ResultViewerSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-64 mx-auto mb-2" />
        <Skeleton className="h-4 w-96 mx-auto" />
      </div>

      {/* Section Cards */}
      {Array.from({ length: 4 }).map((_, index) => (
        <CardSkeleton key={index} lines={index === 3 ? 6 : 4} />
      ))}

      {/* Interview Section */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Skeleton className="w-8 h-8 rounded-full" />
            <Skeleton className="h-6 w-32" />
          </div>
        </div>
        <InterviewSkeleton />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-4 pt-4">
        <Skeleton className="h-12 w-32 rounded-lg" />
        <Skeleton className="h-12 w-48 rounded-lg" />
      </div>
    </div>
  )
}

// ============================================================
// Loading Spinner
// ============================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4'
  }[size]

  return (
    <div
      className={cn(
        'border-rose-200 border-t-rose-500 rounded-full animate-spin',
        sizeClass,
        className
      )}
    />
  )
}

// ============================================================
// Full Page Loading
// ============================================================

interface FullPageLoadingProps {
  message?: string
  subMessage?: string
}

export function FullPageLoading({
  message = '스토리 초안을 작성하고 있어요...',
  subMessage = '잠시만 기다려주세요'
}: FullPageLoadingProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex flex-col items-center">
          {/* Animated Icon */}
          <div className="relative mb-6">
            <Spinner size="lg" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl animate-pulse">✨</span>
            </div>
          </div>

          {/* Messages */}
          <p className="text-gray-800 font-semibold text-lg text-center">
            {message}
          </p>
          <p className="text-sm text-gray-500 mt-2 text-center">
            {subMessage}
          </p>

          {/* Progress dots */}
          <div className="flex gap-1 mt-4">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 bg-rose-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Skeleton
