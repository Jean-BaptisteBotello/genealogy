'use client'
import { useState, useEffect, useTransition, useRef } from 'react'
import { searchPersons } from '@/server-actions/search'
import type { Person } from '@/lib/types/database'

interface SearchOverlayProps {
  onClose: () => void
  onSelectPerson: (id: string) => void
}

export function SearchOverlay({ onClose, onSelectPerson }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Person[]>([])
  const [searched, setSearched] = useState(false)
  const [isPending, startTransition] = useTransition()
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  // Debounced search: 300ms after last keystroke
  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setSearched(false)
      return
    }
    const t = setTimeout(() => {
      startTransition(async () => {
        const data = await searchPersons(query)
        setResults(data)
        setSearched(true)
      })
    }, 300)
    return () => clearTimeout(t)
  }, [query])

  function handleSelect(id: string) {
    onSelectPerson(id)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        data-testid="search-backdrop"
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg">
        <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg shadow-2xl overflow-hidden">
          <div className="flex items-center px-4 py-3 border-b border-[#1e3a5f]">
            <span className="text-gray-500 mr-2 text-sm">🔍</span>
            <input
              ref={inputRef}
              role="searchbox"
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Rechercher par nom, prénom, lieu…"
              className="flex-1 bg-transparent text-white text-sm placeholder:text-gray-600 focus:outline-none"
            />
            {isPending && (
              <span className="text-gray-600 text-xs ml-2 animate-pulse">…</span>
            )}
          </div>

          {query.trim() && (
            <ul className="max-h-72 overflow-y-auto">
              {results.length > 0 ? (
                results.map(person => (
                  <li key={person.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(person.id)}
                      className="w-full text-left px-4 py-2.5 hover:bg-white/5 flex items-center gap-3 transition-colors"
                    >
                      <div>
                        <p className="text-white text-sm">
                          {person.prenom} {person.nom}
                        </p>
                        {(person.lieu_naissance || person.date_naissance) && (
                          <p className="text-xs text-gray-500">
                            {[person.lieu_naissance, person.date_naissance
                              ? new Date(person.date_naissance).getFullYear()
                              : null]
                              .filter(Boolean)
                              .join(' · ')}
                          </p>
                        )}
                      </div>
                    </button>
                  </li>
                ))
              ) : searched ? (
                <li className="px-4 py-6 text-center text-sm text-gray-500 italic">
                  Aucun résultat pour « {query.trim()} »
                </li>
              ) : null}
            </ul>
          )}
        </div>
      </div>
    </>
  )
}
