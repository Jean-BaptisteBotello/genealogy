'use client'
import { useState, useMemo } from 'react'
import type { Person } from '@/lib/types/database'

interface PersonSelectorProps {
  persons: Person[]
  selectedPerson: Person | null
  onSelect: (person: Person) => void
}

function initials(p: Person): string {
  return `${p.prenom?.[0] ?? ''}${p.nom?.[0] ?? ''}`.toUpperCase() || '?'
}

function displayDates(p: Person): string {
  const birth = p.date_naissance?.slice(0, 4) ?? '?'
  const death = p.date_deces?.slice(0, 4) ?? ''
  return death ? `${birth} – ${death}` : birth
}

export function PersonSelector({ persons, selectedPerson, onSelect }: PersonSelectorProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return persons.slice(0, 20)
    return persons
      .filter((p) => `${p.prenom} ${p.nom}`.toLowerCase().includes(q))
      .slice(0, 20)
  }, [persons, query])

  const handleSelect = (p: Person) => {
    onSelect(p)
    setIsSearching(false)
    setQuery('')
  }

  if (selectedPerson && !isSearching) {
    return (
      <div
        className="flex items-center gap-3 p-3 rounded-lg"
        style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)' }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold shrink-0"
          style={{ background: 'var(--accent-hover, #ede9fe)', color: 'var(--accent, #7c3aed)' }}
        >
          {initials(selectedPerson)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
            {selectedPerson.prenom} {selectedPerson.nom}
          </div>
          <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
            {displayDates(selectedPerson)}
            {selectedPerson.lieu_naissance ? ` · ${selectedPerson.lieu_naissance}` : ''}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsSearching(true)}
          className="text-xs px-2 py-1 rounded transition-colors"
          style={{ color: 'var(--accent, #7c3aed)' }}
        >
          Changer
        </button>
      </div>
    )
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)' }}
    >
      <input
        type="text"
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher une personne…"
        className="w-full px-3 py-2 text-sm outline-none"
        style={{ background: 'transparent', color: 'var(--text-primary)' }}
      />
      <div className="max-h-64 overflow-y-auto border-t" style={{ borderColor: 'var(--border, #e5e2dd)' }}>
        {filtered.length === 0 ? (
          <div className="p-3 text-xs text-center" style={{ color: 'var(--text-secondary)' }}>
            Aucune personne trouvée
          </div>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleSelect(p)}
              className="w-full flex items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-black/5"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ background: 'var(--accent-hover, #ede9fe)', color: 'var(--accent, #7c3aed)' }}
              >
                {initials(p)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                  {p.prenom} {p.nom}
                </div>
                <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {displayDates(p)}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )
}
