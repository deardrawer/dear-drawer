'use client'
import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  noPadding?: boolean
}

export default function GeunnalCard({ noPadding, className = '', children, ...props }: CardProps) {
  return (
    <div
      className={`bg-white rounded-2xl border border-[#E8E4F0] ${noPadding ? '' : 'p-4'} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
