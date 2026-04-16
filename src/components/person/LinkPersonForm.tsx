'use client'
import { useState, useTransition } from 'react'
import { createRelationship } from '@/server-actions/relationships'
import {
  deriveRelationship,
  ROLES_FAMILLE_DIRECTE,
  ROLES_FAMILLE_ETENDUE,
  type RelationshipRole,
} from '@/lib/relationship-roles'
import type { Person } from '@/lib/types/database'

interface LinkPersonFormProps {
  currentPersonId: string
  persons: Person[]
  onClose: () => void
}

function RoleButton({
  role, selectedRole, onSelect,
}: {
  role: RelationshipRole
  selectedRole: RelationshipRole | null
  onSelect: (r: RelationshipRole) => void
}) {
  const active = selectedRole === role
  return (
    <button
      type="button"
      onClick={() => onSelect(role)}
      className="text-[10px] px-2 py-0.5 rounded transition-colors"
      style={{
        border: `1px solid ${active ? 'var(--text-link, #3b82f6)' : 'var(--divider, #1e3a5f)'}`,
        color: active ? 'var(--text-primary, white)' : 'var(--text-secondary, #6b7280)',
        background: active ? 'var(--accent-hover, rgba(59,130,246,0.15))' : 'transparent',
      }}
    >
      {role}
    </button>
  )
}

export function LinkPersonForm({ currentPersonId, persons, onClose }: LinkPersonFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RelationshipRole | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function resetAndClose() {
    setSearchQuery('')
    setSelectedPersonId(null)
    setSelectedRole(null)
    setError(null)
    onClose()
  }

  const filtered = persons
    .filter(p => p.id !== currentPersonId)
    .filter(p => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return p.prenom.toLowerCase().includes(q) || p.nom.toLowerCase().includes(q)
    })

  function handleSubmit() {
    if (!selectedPersonId || !selectedRole) return
    setError(null)

    const derived = deriveRelationship(selectedRole, currentPersonId, selectedPersonId)
    const formData = new FormData()
    formData.set('person_a_id', derived.person_a_id)
    formData.set('person_b_id', derived.person_b_id)
    formData.set('type', derived.type)
    formData.set('metadata', JSON.stringify(derived.metadata))

    startTransition(async () => {
      const result = await createRelationship(formData)
      if (result.error) {
        setError(result.error)
        return
      }
      resetAndClose()
    })
  }

  const canSubmit = selectedPersonId !== null && selectedRole !== null && !isPending

  return (
    <div className="mt-2 flex flex-col gap-2">
      <input
        autoFocus
        type="text"
        placeholder="Rechercher une personne…"
        value={searchQuery}
        onChange={e => setSearchQuery(e.target.value)}
        className="w-full rounded px-2 py-1.5 text-xs focus:outline-none"
        style={{
          background: 'var(--input-bg, #0d1117)',
          border: '1px solid var(--divider, #1e3a5f)',
          color: 'var(--text-primary, white)',
        }}
      />

      {searchQuery.length > 0 && filtered.length > 0 && (
        <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5" style={{ border: '1px solid var(--divider-light, rgba(60,30,45,0.08))', borderRadius: 6, padding: 2 }}>
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersonId(p.id)}
              className="text-left text-xs px-2 py-1.5 rounded transition-colors"
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

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--section-label, #4b5563)' }}>
            Directe
          </div>
          <div className="flex flex-wrap gap-1">
            {ROLES_FAMILLE_DIRECTE.map(role => (
              <RoleButton key={role} role={role} selectedRole={selectedRole} onSelect={setSelectedRole} />
            ))}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--section-label, #4b5563)' }}>
            Étendue
          </div>
          <div className="flex flex-wrap gap-1">
            {ROLES_FAMILLE_ETENDUE.map(role => (
              <RoleButton key={role} role={role} selectedRole={selectedRole} onSelect={setSelectedRole} />
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-[10px] text-red-500">{error}</p>}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={resetAndClose}
          className="text-[10px]"
          style={{ color: 'var(--text-muted, #6b7280)' }}
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="text-[10px] px-3 py-1 bg-blue-600 text-white rounded disabled:opacity-40 hover:bg-blue-500"
        >
          {isPending ? '…' : 'Lier →'}
        </button>
      </div>
    </div>
  )
}
