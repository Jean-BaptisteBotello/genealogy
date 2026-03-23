// src/components/suggestions/SuggestionsPanel.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { approveSuggestion, rejectSuggestion } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'

interface SuggestionsPanelProps {
  suggestions: SuggestionWithProposer[]
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  EDIT_PERSON: 'Modifier une personne',
  ADD_PERSON: 'Ajouter une personne',
  DELETE_PERSON: 'Supprimer une personne',
  ADD_RELATIONSHIP: 'Ajouter une relation',
  DELETE_RELATIONSHIP: 'Supprimer une relation',
}

function SuggestionDiff({ suggestion }: { suggestion: SuggestionWithProposer }) {
  if (suggestion.type === 'EDIT_PERSON') {
    const fields = Object.entries(suggestion.payload).map(([k, v]) => (
      <span key={k} className="text-xs text-blue-400">{k}: <span className="text-white">{String(v ?? '—')}</span> </span>
    ))
    return <div className="flex flex-wrap gap-1 mt-1">{fields}</div>
  }
  if (suggestion.type === 'ADD_PERSON') {
    const p = suggestion.payload as Record<string, unknown>
    return <span className="text-xs text-green-400">{String(p.prenom ?? '')} {String(p.nom ?? '')}</span>
  }
  if (suggestion.type === 'ADD_RELATIONSHIP') {
    const r = suggestion.payload as Record<string, unknown>
    return <span className="text-xs text-yellow-400">{String(r.type ?? '')}</span>
  }
  return <span className="text-xs text-red-400">Suppression</span>
}

export function SuggestionsPanel({ suggestions, onClose }: SuggestionsPanelProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [rejectingId, setRejectingId] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleApprove(id: string) {
    setError(null)
    startTransition(async () => {
      const result = await approveSuggestion(id)
      if (result.error) { setError(result.error); return }
      router.refresh()
    })
  }

  function handleRejectConfirm(id: string) {
    if (!rejectReason.trim()) {
      setError('Veuillez indiquer une raison.')
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await rejectSuggestion(id, rejectReason)
      if (result.error) { setError(result.error); return }
      setRejectingId(null)
      setRejectReason('')
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Suggestions en attente ({suggestions.length})</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        {error && <p className="text-xs text-red-400 mb-2">{error}</p>}

        <div className="flex-1 overflow-y-auto space-y-3">
          {suggestions.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucune suggestion en attente.</p>
          )}
          {suggestions.map(s => (
            <div key={s.id} className="border border-[#1e3a5f]/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">
                    <span className="text-white">{TYPE_LABEL[s.type]}</span>
                    {' · '}
                    <span>{s.users?.email ?? s.suggested_by}</span>
                    {' · '}
                    <span>{new Date(s.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                  <SuggestionDiff suggestion={s} />
                </div>
                <div className="flex gap-1 shrink-0">
                  {rejectingId === s.id ? null : (
                    <>
                      <button type="button" disabled={isPending}
                        onClick={() => handleApprove(s.id)}
                        className="px-2 py-1 bg-green-600/20 text-green-400 border border-green-600/30 rounded text-xs hover:bg-green-600/30 disabled:opacity-50">
                        Approuver
                      </button>
                      <button type="button" disabled={isPending}
                        onClick={() => { setRejectingId(s.id); setRejectReason('') }}
                        className="px-2 py-1 bg-red-600/20 text-red-400 border border-red-600/30 rounded text-xs hover:bg-red-600/30 disabled:opacity-50">
                        Rejeter
                      </button>
                    </>
                  )}
                </div>
              </div>
              {rejectingId === s.id && (
                <div className="mt-2 space-y-2">
                  <textarea
                    placeholder="Raison du refus…"
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={2}
                    className="w-full text-xs bg-[#0d1117] border border-[#1e3a5f] text-white rounded px-2 py-1.5 placeholder-gray-600 resize-none"
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={() => setRejectingId(null)}
                      className="text-xs text-gray-500 hover:text-gray-300">Annuler</button>
                    <button type="button" disabled={isPending}
                      onClick={() => handleRejectConfirm(s.id)}
                      className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 disabled:opacity-50">
                      Confirmer le rejet
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
