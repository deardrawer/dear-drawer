'use client'

import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react'

// ============================================================
// Types
// ============================================================

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  fullWidth?: boolean
  icon?: ReactNode
  iconPosition?: 'left' | 'right'
  children: ReactNode
}

// ============================================================
// Style Configuration
// ============================================================

const variantStyles: Record<ButtonVariant, { base: string; style: React.CSSProperties }> = {
  primary: {
    base: 'text-white font-semibold',
    style: {
      backgroundColor: '#C9A962',
    },
  },
  secondary: {
    base: 'font-medium',
    style: {
      backgroundColor: '#F5F3EE',
      color: '#555',
    },
  },
  danger: {
    base: 'text-white font-semibold',
    style: {
      backgroundColor: '#DC2626',
    },
  },
  ghost: {
    base: 'font-medium',
    style: {
      backgroundColor: 'transparent',
      color: '#666',
      border: '1px solid #E8E4DD',
    },
  },
}

const sizeStyles: Record<ButtonSize, { className: string; iconSize: number }> = {
  sm: {
    className: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
    iconSize: 12,
  },
  md: {
    className: 'px-4 py-2.5 text-sm rounded-xl gap-2',
    iconSize: 16,
  },
  lg: {
    className: 'px-6 py-3.5 text-base rounded-xl gap-2',
    iconSize: 18,
  },
}

// ============================================================
// Button Component
// ============================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      icon,
      iconPosition = 'left',
      children,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const variantConfig = variantStyles[variant]
    const sizeConfig = sizeStyles[size]
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          transition-all duration-150
          active:scale-[0.98]
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${variantConfig.base}
          ${sizeConfig.className}
          ${fullWidth ? 'w-full' : ''}
          ${className}
        `}
        style={{
          ...variantConfig.style,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          ...style,
        }}
        {...props}
      >
        {/* Loading Spinner */}
        {loading && (
          <span
            className="animate-spin rounded-full border-2"
            style={{
              width: sizeConfig.iconSize,
              height: sizeConfig.iconSize,
              borderColor: variant === 'primary' || variant === 'danger' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              borderTopColor: variant === 'primary' || variant === 'danger' ? '#FFF' : '#666',
            }}
          />
        )}

        {/* Left Icon */}
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}

        {/* Text */}
        <span>{children}</span>

        {/* Right Icon */}
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </button>
    )
  }
)

Button.displayName = 'Button'

// ============================================================
// Icon Button Component
// ============================================================

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon: ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      variant = 'ghost',
      size = 'md',
      loading = false,
      icon,
      disabled,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const variantConfig = variantStyles[variant]
    const sizeMap = { sm: 32, md: 40, lg: 48 }
    const iconSizeMap = { sm: 14, md: 16, lg: 20 }
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center
          rounded-full
          transition-all duration-150
          active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
          ${variantConfig.base}
          ${className}
        `}
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          ...variantConfig.style,
          fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
          ...style,
        }}
        {...props}
      >
        {loading ? (
          <span
            className="animate-spin rounded-full border-2"
            style={{
              width: iconSizeMap[size],
              height: iconSizeMap[size],
              borderColor: variant === 'primary' || variant === 'danger' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
              borderTopColor: variant === 'primary' || variant === 'danger' ? '#FFF' : '#666',
            }}
          />
        ) : (
          icon
        )}
      </button>
    )
  }
)

IconButton.displayName = 'IconButton'

// ============================================================
// Link Button Component
// ============================================================

interface LinkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
}

export function LinkButton({ children, className = '', ...props }: LinkButtonProps) {
  return (
    <button
      className={`
        text-sm font-medium underline
        transition-colors duration-150
        hover:opacity-80
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      style={{
        color: '#C9A962',
        fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      }}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
