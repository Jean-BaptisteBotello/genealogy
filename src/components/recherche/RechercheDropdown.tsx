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
        className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5"
        style={{
          color: isOpen ? '#fff' : '#7c3aed',
          background: isOpen ? '#7c3aed' : 'rgba(124,58,237,0.08)',
          border: '1px solid rgba(124,58,237,0.2)',
          boxShadow: '0 0 0 3px rgba(124,58,237,0.06)',
        }}
        aria-haspopup="menu"
        aria-expanded={isOpen}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
        Recherches
        <span className="text-[10px]">{isOpen ? '▴' : '▾'}</span>
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
