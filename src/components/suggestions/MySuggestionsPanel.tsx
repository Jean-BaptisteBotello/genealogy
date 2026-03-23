// src/components/suggestions/MySuggestionsPanel.tsx
'use client'
import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getMySuggestions, cancelSuggestion } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'

interface MySuggestionsPanelProps {
  onClose: () => void
}

const TYPE_LABEL: Record<string, string> = {
  EDIT_PERSON: 'Modifier une personne',
  ADD_PERSON: 'Ajouter une personne',
  DELETE_PERSON: 'Supprimer une personne',
  ADD_RELATIONSHIP: 'Ajouter une relation',
  DELETE_RELATIONSHIP: 'Supprimer une relation',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
}

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'text-yellow-400',
  APPROVED: 'text-green-400',
  REJECTED: 'text-red-400',
}

export function MySuggestionsPanel({ onClose }: MySuggestionsPanelProps) {
  const router = useRouter()
  const [suggestions, setSuggestions] = useState<SuggestionWithProposer[]>([])
  const [loading, setLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    getMySuggestions().then(data => {
      setSuggestions(data)
      setLoading(false)
    })
  }, [])

  function handleCancel(id: string) {
    startTransition(async () => {
      await cancelSuggestion(id)
      setSuggestions(prev => prev.filter(s => s.id !== id))
      router.refresh()
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-[#080d16] border border-[#1e3a5f] rounded-xl w-full max-w-lg p-6 shadow-2xl max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-white font-semibold text-sm">Mes propositions</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="text-gray-500 hover:text-gray-300">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {loading && <p className="text-xs text-gray-600 italic">Chargement…</p>}
          {!loading && suggestions.length === 0 && (
            <p className="text-xs text-gray-600 italic">Aucune proposition pour l'instant.</p>
          )}
          {suggestions.map(s => (
            <div key={s.id} className="border border-[#1e3a5f]/40 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs text-white">{TYPE_LABEL[s.type]}</div>
                  <div className="text-xs text-gray-500">{new Date(s.created_at).toLocaleDateString('fr-FR')}</div>
                  <div className={`text-xs font-medium mt-1 ${STATUS_COLOR[s.status]}`}>
                    {STATUS_LABEL[s.status]}
                  </div>
                  {s.status === 'REJECTED' && s.rejection_reason && (
                    <div className="text-xs text-gray-400 mt-1 italic">{s.rejection_reason}</div>
                  )}
                </div>
                {s.status === 'PENDING' && (
                  <button type="button" disabled={isPending}
                    onClick={() => handleCancel(s.id)}
                    className="text-xs text-gray-500 hover:text-red-400 disabled:opacity-50">
                    Annuler
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
