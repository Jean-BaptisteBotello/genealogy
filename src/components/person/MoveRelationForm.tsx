'use client'
import { useState, useTransition } from 'react'
import { moveRelationship } from '@/server-actions/relationships'
import type { Person } from '@/lib/types/database'

interface MoveRelationFormProps {
  relationshipId: string
  currentPersonId: string
  persons: Person[]
  excludePersonId: string
  onClose: () => void
}

export function MoveRelationForm({
  relationshipId,
  currentPersonId,
  persons,
  excludePersonId,
  onClose,
}: MoveRelationFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const filtered = persons
    .filter(p => p.id !== currentPersonId && p.id !== excludePersonId)
    .filter(p => {
      if (!searchQuery) return false
      const q = searchQuery.toLowerCase()
      return p.prenom.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q)
    })

  function handleSubmit() {
    if (!selectedPersonId) return
    setError(null)

    startTransition(async () => {
      const result = await moveRelationship(relationshipId, currentPersonId, selectedPersonId)
      if (result.error) {
        setError(result.error)
        return
      }
      onClose()
    })
  }

  return (
    <div className="flex flex-col gap-1.5 py-1">
      <input
        autoFocus
        type="text"
        placeholder="Nouvelle personne…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full rounded px-2 py-1.5 text-xs focus:outline-none"
        style={{
          background: 'var(--input-bg, #0d1117)',
          border: '1px solid var(--divider, #1e3a5f)',
          color: 'var(--text-primary, white)',
        }}
      />

      {filtered.length > 0 && (
        <div
          className="max-h-24 overflow-y-auto flex flex-col gap-0.5"
          style={{ border: '1px solid var(--divider-light, rgba(60,30,45,0.08))', borderRadius: 6, padding: 2 }}
        >
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersonId(p.id)}
              className="text-left text-xs px-2 py-1 rounded transition-colors"
              style={{
                background: selectedPersonId === p.id ? 'var(--accent-hover, rgba(59,130,246,0.2))' : 'transparent',
                color: selectedPersonId === p.id ? 'var(--text-primary, white)' : 'var(--text-secondary, #9ca3af)',
                fontWeight: selectedPersonId === p.id ? 500 : 400,
              }}
            >
              {p.prenom} {p.nom}
              {p.date_naissance ? ` · ${p.date_naissance.slice(0, 4)}` : ''}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="text-[10px]"
          style={{ color: 'var(--text-muted, #6b7280)' }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!selectedPersonId || isPending}
          className="text-[10px] px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40 hover:bg-blue-500"
        >
          {isPending ? '…' : 'Déplacer →'}
        </button>
      </div>
    </div>
  )
}
