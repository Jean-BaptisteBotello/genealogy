// src/app/(app)/tree/page.tsx
'use client'
import { useTree } from '@/lib/context/tree-context'

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export default function TreePage() {
  const { persons, openAddPerson, selectPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🌳</div>
          <h2 className="text-xl font-semibold text-white mb-2">
            Votre arbre vous attend
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Commencez par ajouter la première personne.
          </p>
          <button
            type="button"
            onClick={openAddPerson}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            + Ajouter une personne
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-auto p-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {persons.map(person => {
          const birthYear = formatYear(person.date_naissance)
          const deathYear = formatYear(person.date_deces)
          const dates = [birthYear, deathYear].filter(Boolean).join(' – ')
          return (
            <button
              key={person.id}
              type="button"
              onClick={() => selectPerson(person.id)}
              className="text-left bg-[#0d1117] border border-[#1e3a5f] rounded-lg p-3 hover:border-blue-500/50 transition-colors"
            >
              <p className="text-white text-sm font-medium">
                {person.prenom} {person.nom}
              </p>
              {dates && (
                <p className="text-xs text-gray-500 mt-0.5">{dates}</p>
              )}
              {person.lieu_naissance && (
                <p className="text-xs text-gray-600 mt-0.5">
                  {person.lieu_naissance}
                </p>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
