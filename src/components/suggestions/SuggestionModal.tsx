// src/components/suggestions/SuggestionModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createSuggestion } from '@/server-actions/suggestions'
import type { Person, Relationship } from '@/lib/types/database'

export type SuggestionModalMode =
  | { type: 'EDIT_PERSON'; person: Person }
  | { type: 'ADD_PERSON' }
  | { type: 'DELETE_PERSON'; person: Person }
  | { type: 'ADD_RELATIONSHIP'; persons: Person[] }
  | { type: 'DELETE_RELATIONSHIP'; relationship: Relationship; persons: Person[] }

interface SuggestionModalProps {
  mode: SuggestionModalMode
  onClose: () => void
}

export function SuggestionModal({ mode, onClose }: SuggestionModalProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // State for EDIT_PERSON and ADD_PERSON forms
  const initial = mode.type === 'EDIT_PERSON' ? mode.person : null
  const [prenom, setPrenom] = useState(initial?.prenom ?? '')
  const [nom, setNom] = useState(initial?.nom ?? '')
  const [dateNaissance, setDateNaissance] = useState(initial?.date_naissance ?? '')
  const [lieuNaissance, setLieuNaissance] = useState(initial?.lieu_naissance ?? '')
  const [dateDeces, setDateDeces] = useState(initial?.date_deces ?? '')
  const [lieuDeces, setLieuDeces] = useState(initial?.lieu_deces ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  // State for ADD_RELATIONSHIP form
  const [relPersonAId, setRelPersonAId] = useState('')
  const [relPersonBId, setRelPersonBId] = useState('')
  const [relType, setRelType] = useState('UNION')

  function handleSubmitPerson(targetId?: string) {
    setError(null)
    let payload: Record<string, unknown>

    if (mode.type === 'EDIT_PERSON') {
      // Only include changed fields
      const p = mode.person
      payload = {}
      if (prenom !== p.prenom) payload.prenom = prenom
      if (nom !== p.nom) payload.nom = nom
      if (dateNaissance !== (p.date_naissance ?? '')) payload.date_naissance = dateNaissance || null
      if (lieuNaissance !== (p.lieu_naissance ?? '')) payload.lieu_naissance = lieuNaissance || null
      if (dateDeces !== (p.date_deces ?? '')) payload.date_deces = dateDeces || null
      if (lieuDeces !== (p.lieu_deces ?? '')) payload.lieu_deces = lieuDeces || null
      if (notes !== (p.notes ?? '')) payload.notes = notes || null
    } else {
      payload = {
        prenom,
        nom,
        date_naissance: dateNaissance || null,
        lieu_naissance: lieuNaissance || null,
        date_deces: dateDeces || null,
        lieu_deces: lieuDeces || null,
        notes: notes || null,
      }
    }

    if (mode.type === 'EDIT_PERSON' && Object.keys(payload).length === 0) {
      setError('Aucune modification détectée.')
      return
    }

    startTransition(async () => {
      const result = await createSuggestion(
        mode.type === 'EDIT_PERSON' ? 'EDIT_PERSON' : 'ADD_PERSON',
        payload,
        targetId
      )
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  function handleDelete(type: 'DELETE_PERSON' | 'DELETE_RELATIONSHIP', targetId: string) {
    setError(null)
    startTransition(async () => {
      const result = await createSuggestion(type, {}, targetId)
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  function handleAddRelationship() {
    setError(null)
    if (relPersonAId === relPersonBId) {
      setError('Les deux personnes doivent être différentes.')
      return
    }
    startTransition(async () => {
      const result = await createSuggestion('ADD_RELATIONSHIP', {
        person_a_id: relPersonAId,
        person_b_id: relPersonBId,
        type: relType,
      })
      if (result.error) { setError(result.error); return }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">
            {mode.type === 'EDIT_PERSON' && 'Proposer une modification'}
            {mode.type === 'ADD_PERSON' && 'Proposer une nouvelle personne'}
            {mode.type === 'DELETE_PERSON' && 'Proposer la suppression'}
            {mode.type === 'ADD_RELATIONSHIP' && 'Proposer une relation'}
            {mode.type === 'DELETE_RELATIONSHIP' && 'Proposer la suppression de la relation'}
          </h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        {error && <p className="text-xs text-red-400 mb-3">{error}</p>}

        {(mode.type === 'EDIT_PERSON' || mode.type === 'ADD_PERSON') && (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                placeholder="Prénom"
                value={prenom}
                onChange={e => setPrenom(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
              <input
                placeholder="Nom"
                value={nom}
                onChange={e => setNom(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <input type="date" value={dateNaissance} onChange={e => setDateNaissance(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5" />
              <input placeholder="Lieu naissance" value={lieuNaissance} onChange={e => setLieuNaissance(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600" />
            </div>
            <div className="flex gap-2">
              <input type="date" value={dateDeces} onChange={e => setDateDeces(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5" />
              <input placeholder="Lieu décès" value={lieuDeces} onChange={e => setLieuDeces(e.target.value)}
                className="flex-1 text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600" />
            </div>
            <textarea placeholder="Notes" value={notes} onChange={e => setNotes(e.target.value)} rows={2}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600 resize-none" />
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose}
                className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending}
                onClick={() => handleSubmitPerson(mode.type === 'EDIT_PERSON' ? mode.person.id : undefined)}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                Proposer
              </button>
            </div>
          </div>
        )}

        {mode.type === 'DELETE_PERSON' && (
          <div>
            <p className="text-xs text-gray-400 mb-4">
              Proposer la suppression de <strong className="text-white">{mode.person.prenom} {mode.person.nom}</strong> ?
            </p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending} onClick={() => handleDelete('DELETE_PERSON', mode.person.id)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                Proposer la suppression
              </button>
            </div>
          </div>
        )}

        {mode.type === 'DELETE_RELATIONSHIP' && (
          <div>
            <p className="text-xs text-gray-400 mb-4">Supprimer cette relation ?</p>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending} onClick={() => handleDelete('DELETE_RELATIONSHIP', mode.relationship.id)}
                className="px-3 py-1.5 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                Proposer la suppression
              </button>
            </div>
          </div>
        )}

        {mode.type === 'ADD_RELATIONSHIP' && (
          <div className="space-y-2">
            <select value={relPersonAId} onChange={e => setRelPersonAId(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              <option value="">Parent / Personne A</option>
              {mode.persons.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={relPersonBId} onChange={e => setRelPersonBId(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              <option value="">Enfant / Personne B</option>
              {mode.persons.map(p => <option key={p.id} value={p.id}>{p.prenom} {p.nom}</option>)}
            </select>
            <select value={relType} onChange={e => setRelType(e.target.value)}
              className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-gray-300 rounded px-2 py-1.5">
              {['PARENT_CHILD', 'UNION', 'ADOPTION', 'SIBLING', 'HALF_SIBLING', 'STEP'].map(t =>
                <option key={t} value={t}>{t}</option>
              )}
            </select>
            <div className="flex gap-2 justify-end pt-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-300">Annuler</button>
              <button type="button" disabled={isPending || !relPersonAId || !relPersonBId} onClick={handleAddRelationship}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                Proposer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
