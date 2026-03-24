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

export function LinkPersonForm({ currentPersonId, persons, onClose }: LinkPersonFormProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [selectedRole, setSelectedRole] = useState<RelationshipRole | null>(null)
  const [isExtendedOpen, setIsExtendedOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

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
      onClose()
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
        className="w-full bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
      />

      {filtered.length > 0 && (
        <div className="max-h-24 overflow-y-auto flex flex-col gap-0.5">
          {filtered.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPersonId(p.id)}
              className={`text-left text-xs px-2 py-1 rounded ${
                selectedPersonId === p.id
                  ? 'bg-blue-600/30 text-blue-200'
                  : 'text-gray-400 hover:bg-[#1e3a5f]/30'
              }`}
            >
              {p.prenom} {p.nom}
              {p.date_naissance ? ` · ${p.date_naissance.slice(0, 4)}` : ''}
            </button>
          ))}
        </div>
      )}

      <div>
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Son rôle</div>
        <div className="flex flex-wrap gap-1">
          {ROLES_FAMILLE_DIRECTE.map(role => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`text-[10px] px-2 py-0.5 rounded border ${
                selectedRole === role
                  ? 'border-blue-500 text-blue-200 bg-blue-600/20'
                  : 'border-[#1e3a5f] text-gray-500 hover:text-gray-300'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={() => setIsExtendedOpen(v => !v)}
          className="text-[10px] text-gray-600 hover:text-gray-400"
        >
          {isExtendedOpen ? '▾' : '▸'} Famille étendue
        </button>
        {isExtendedOpen && (
          <div className="flex flex-wrap gap-1 mt-1">
            {ROLES_FAMILLE_ETENDUE.map(role => (
              <button
                key={role}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`text-[10px] px-2 py-0.5 rounded border ${
                  selectedRole === role
                    ? 'border-blue-500 text-blue-200 bg-blue-600/20'
                    : 'border-[#1e3a5f] text-gray-500 hover:text-gray-300'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[10px] text-red-400">{error}</p>}

      <div className="flex justify-end gap-2 mt-1">
        <button
          type="button"
          onClick={onClose}
          className="text-[10px] text-gray-600 hover:text-gray-300"
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
