'use client'

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react'

// ============================================================
// Common Styles
// ============================================================

const baseInputStyle: React.CSSProperties = {
  fontFamily: 'Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  borderColor: '#E8E4DD',
  backgroundColor: '#FFF',
  color: '#2C2C2C',
}

const focusInputStyle: React.CSSProperties = {
  borderColor: '#C9A962',
  outline: 'none',
  boxShadow: '0 0 0 3px rgba(201, 169, 98, 0.1)',
}

const errorInputStyle: React.CSSProperties = {
  borderColor: '#DC2626',
  boxShadow: '0 0 0 3px rgba(220, 38, 38, 0.1)',
}

// ============================================================
// Input Component
// ============================================================

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: ReactNode
  rightIcon?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#555' }}
          >
            {label}
          </label>
        )}

        {/* Input Container */}
        <div className="relative">
          {/* Left Icon */}
          {leftIcon && (
            <span
              className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ color: '#999' }}
            >
              {leftIcon}
            </span>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-xl border text-sm
              transition-all duration-150
              placeholder:text-gray-400
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
              ${leftIcon ? 'pl-10' : ''}
              ${rightIcon ? 'pr-10' : ''}
              ${className}
            `}
            style={{
              ...baseInputStyle,
              ...(error ? errorInputStyle : {}),
            }}
            onFocus={(e) => {
              if (!error) {
                Object.assign(e.target.style, focusInputStyle)
              }
              props.onFocus?.(e)
            }}
            onBlur={(e) => {
              e.target.style.boxShadow = ''
              if (!error) {
                e.target.style.borderColor = '#E8E4DD'
              }
              props.onBlur?.(e)
            }}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          />

          {/* Right Icon */}
          {rightIcon && (
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
              style={{ color: '#999' }}
            >
              {rightIcon}
            </span>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs mt-1.5 flex items-center gap-1"
            style={{ color: '#DC2626' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs mt-1.5"
            style={{ color: '#999' }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

// ============================================================
// Textarea Component
// ============================================================

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  helperText?: string
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      error,
      helperText,
      fullWidth = true,
      className = '',
      id,
      rows = 4,
      ...props
    },
    ref
  ) => {
    const inputId = id || `textarea-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#555' }}
          >
            {label}
          </label>
        )}

        {/* Textarea */}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          className={`
            w-full px-4 py-3 rounded-xl border text-sm resize-none
            transition-all duration-150
            placeholder:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
            ${className}
          `}
          style={{
            ...baseInputStyle,
            ...(error ? errorInputStyle : {}),
          }}
          onFocus={(e) => {
            if (!error) {
              Object.assign(e.target.style, focusInputStyle)
            }
            props.onFocus?.(e)
          }}
          onBlur={(e) => {
            e.target.style.boxShadow = ''
            if (!error) {
              e.target.style.borderColor = '#E8E4DD'
            }
            props.onBlur?.(e)
          }}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs mt-1.5 flex items-center gap-1"
            style={{ color: '#DC2626' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs mt-1.5"
            style={{ color: '#999' }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// ============================================================
// Select Component
// ============================================================

interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

interface SelectProps extends Omit<InputHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  label?: string
  error?: string
  helperText?: string
  options: SelectOption[]
  placeholder?: string
  fullWidth?: boolean
  onChange?: (value: string) => void
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      error,
      helperText,
      options,
      placeholder,
      fullWidth = true,
      className = '',
      id,
      onChange,
      ...props
    },
    ref
  ) => {
    const inputId = id || `select-${Math.random().toString(36).substr(2, 9)}`

    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {/* Label */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium mb-1.5"
            style={{ color: '#555' }}
          >
            {label}
          </label>
        )}

        {/* Select */}
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={`
              w-full px-4 py-3 rounded-xl border text-sm appearance-none
              transition-all duration-150
              disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-50
              ${className}
            `}
            style={{
              ...baseInputStyle,
              ...(error ? errorInputStyle : {}),
              paddingRight: '40px',
            }}
            onChange={(e) => onChange?.(e.target.value)}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>

          {/* Dropdown Arrow */}
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: '#999' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </div>

        {/* Error Message */}
        {error && (
          <p
            id={`${inputId}-error`}
            className="text-xs mt-1.5 flex items-center gap-1"
            style={{ color: '#DC2626' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {/* Helper Text */}
        {!error && helperText && (
          <p
            id={`${inputId}-helper`}
            className="text-xs mt-1.5"
            style={{ color: '#999' }}
          >
            {helperText}
          </p>
        )}
      </div>
    )
  }
)

Select.displayName = 'Select'

export default Input
