'use client'
import { useState, useEffect, useRef } from 'react'

interface RechercheDropdownProps {
  onOpen3233: () => void
  onOpen3236: () => void
}

export function RechercheDropdown({ onOpen3233, onOpen3236 }: RechercheDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen])

  const handleClick = (handler: () => void) => {
    handler()
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="px-3 py-1.5 rounded text-xs transition-colors flex items-center gap-1"
        style={{ color: 'var(--text-secondary)' }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        📋 Recherches
        <span className="text-[10px]">▾</span>
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-72 rounded-lg shadow-lg overflow-hidden z-50"
          style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)' }}
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => handleClick(onOpen3233)}
            className="w-full text-left px-4 py-3 transition-colors hover:bg-black/5"
          >
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              📋 Formulaire 3233
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Renseignements immobiliers
            </div>
          </button>
          <div style={{ borderTop: '1px solid var(--border, #e5e2dd)' }} />
          <button
            type="button"
            role="menuitem"
            onClick={() => handleClick(onOpen3236)}
            className="w-full text-left px-4 py-3 transition-colors hover:bg-black/5"
          >
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              📄 Formulaire 3236
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Copie de documents fonciers
            </div>
          </button>
        </div>
      )}
    </div>
  )
}
