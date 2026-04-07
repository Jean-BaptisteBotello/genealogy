'use client'
import { useState, useEffect, useMemo } from 'react'
import { SPF_DIRECTORY, findSPFByLieu, type SPF } from '@/lib/spf-directory'

interface SPFSelectorProps {
  lieu: string | null
  selectedSPF: SPF | null
  onSelect: (spf: SPF) => void
}

export function SPFSelector({ lieu, selectedSPF, onSelect }: SPFSelectorProps) {
  const [isManual, setIsManual] = useState(false)
  const [query, setQuery] = useState('')

  // Auto-detect on mount / lieu change
  useEffect(() => {
    if (!selectedSPF && lieu) {
      const detected = findSPFByLieu(lieu)
      if (detected) onSelect(detected)
    }
  }, [lieu, selectedSPF, onSelect])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SPF_DIRECTORY
    return SPF_DIRECTORY.filter(
      (s) =>
        s.nom.toLowerCase().includes(q) ||
        s.departementNom.toLowerCase().includes(q) ||
        s.departement.toLowerCase().includes(q)
    )
  }, [query])

  const handleSelect = (spf: SPF) => {
    onSelect(spf)
    setIsManual(false)
    setQuery('')
  }

  if (selectedSPF && !isManual) {
    return (
      <div
        className="p-3 rounded-lg"
        style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)' }}
      >
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: 'var(--accent-hover, #ede9fe)' }}
          >
            🏛️
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              {selectedSPF.nom}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {selectedSPF.departement} · {selectedSPF.departementNom}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              {selectedSPF.email}
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsManual(true)}
          className="text-xs mt-2"
          style={{ color: 'var(--accent, #7c3aed)' }}
        >
          Choisir un autre SPF
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
        placeholder="Rechercher un SPF (nom, département)…"
        className="w-full px-3 py-2 text-sm outline-none"
        style={{ background: 'transparent', color: 'var(--text-primary)' }}
      />
      <div className="max-h-64 overflow-y-auto border-t" style={{ borderColor: 'var(--border, #e5e2dd)' }}>
        {filtered.map((spf) => (
          <button
            key={spf.departement}
            type="button"
            onClick={() => handleSelect(spf)}
            className="w-full text-left px-3 py-2 transition-colors hover:bg-black/5"
          >
            <div className="text-sm" style={{ color: 'var(--text-primary)' }}>
              {spf.nom}
            </div>
            <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              {spf.departement} · {spf.departementNom}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
