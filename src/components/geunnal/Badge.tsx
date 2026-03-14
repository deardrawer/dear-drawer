'use client'
import { HTMLAttributes } from 'react'

type BadgeVariant = 'lavender' | 'blush' | 'soft'

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
}

const variantStyles: Record<BadgeVariant, string> = {
  lavender: 'bg-[#EDE9FA] text-[#8B75D0]',
  blush: 'bg-[#FAE9F0] text-[#D4899A]',
  soft: 'bg-[#F9F7FD] text-[#9B8CC4]',
}

export default function GeunnalBadge({ variant = 'lavender', className = '', children, ...props }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-xl text-[12px] font-medium leading-none ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  )
}
