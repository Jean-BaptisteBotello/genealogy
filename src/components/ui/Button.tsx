'use client'
import { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'px-4 py-2 rounded-md text-sm font-medium transition-colors disabled:opacity-50',
        variant === 'primary' && 'bg-red-500 text-white hover:bg-red-600',
        variant === 'ghost' && 'text-gray-400 hover:text-white hover:bg-white/10',
        variant === 'danger' && 'bg-red-900/50 text-red-400 hover:bg-red-900',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
