// src/components/layout/DetailPanel.tsx
'use client'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  person: Person | null
  personBranches: PersonBranch[]
  branches: Branch[]
  relationships: Relationship[]
  allPersons: Person[]
  onSelectPerson: (id: string | null) => void
  onEditPerson: (id: string) => void
  onDeletePerson: (id: string) => Promise<void>
}

function formatDate(date: string | null): string {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const RELATION_LABEL: Record<string, string> = {
  PARENT_CHILD: 'Parent / Enfant',
  UNION: 'Union',
  ADOPTION: 'Adoption',
  SIBLING: 'Frère / Sœur',
  HALF_SIBLING: 'Demi-frère / Demi-sœur',
  STEP: 'Beau-parent / Bel-enfant',
}

export function DetailPanel({
  isOpen,
  onClose,
  person,
  personBranches,
  branches,
  relationships,
  allPersons,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
}: DetailPanelProps) {
  if (!isOpen) return null

  const personBranchIds = person
    ? personBranches
        .filter(pb => pb.person_id === person.id)
        .map(pb => pb.branch_id)
    : []

  const personBranchList = branches.filter(b => personBranchIds.includes(b.id))

  const personRelationships = person
    ? relationships.filter(
        r => r.person_a_id === person.id || r.person_b_id === person.id
      )
    : []

  function getOtherPerson(rel: Relationship): Person | undefined {
    if (!person) return undefined
    const otherId =
      rel.person_a_id === person.id ? rel.person_b_id : rel.person_a_id
    return allPersons.find(p => p.id === otherId)
  }

  return (
    <aside className="w-64 bg-[#080d16] border-l border-[#1e3a5f] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-[#1e3a5f]">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Détail</span>
        <button type="button" onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs">
          ✕
        </button>
      </div>

      {!person ? (
        <div className="p-3">
          <p className="text-xs text-gray-600 italic">Sélectionnez une personne</p>
        </div>
      ) : (
        <div className="p-3 flex flex-col gap-4 flex-1">
          {/* Identity */}
          <div>
            <h3 className="text-white font-semibold text-sm">
              {person.prenom} {person.nom}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {formatDate(person.date_naissance)}
              {person.lieu_naissance ? ` · ${person.lieu_naissance}` : ''}
            </p>
            {person.date_deces && (
              <p className="text-xs text-gray-600">
                † {formatDate(person.date_deces)}
                {person.lieu_deces ? ` · ${person.lieu_deces}` : ''}
              </p>
            )}
            {person.notes && (
              <p className="text-xs text-gray-500 mt-2 italic">{person.notes}</p>
            )}
          </div>

          {/* Branches */}
          {personBranchList.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                Branches
              </div>
              <div className="flex flex-wrap gap-1">
                {personBranchList.map(b => (
                  <span
                    key={b.id}
                    className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: `${b.couleur}22`,
                      color: b.couleur,
                      border: `1px solid ${b.couleur}44`,
                    }}
                  >
                    {b.nom}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relations */}
          {personRelationships.length > 0 && (
            <div>
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
                Relations
              </div>
              <div className="flex flex-col gap-1">
                {personRelationships.map(rel => {
                  const other = getOtherPerson(rel)
                  if (!other) return null
                  return (
                    <button
                      key={rel.id}
                      type="button"
                      onClick={() => onSelectPerson(other.id)}
                      className="text-left text-xs text-blue-300 hover:text-blue-200 py-0.5 flex items-center gap-1"
                    >
                      <span className="text-[10px] text-gray-600">
                        {RELATION_LABEL[rel.type] ?? rel.type}
                      </span>
                      <span>{other.prenom} {other.nom}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents placeholder — wired in Chunk 2 */}
          <div>
            <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">
              Documents
            </div>
            <p className="text-xs text-gray-600 italic">Chargement en Chunk 2…</p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-auto pt-2 border-t border-[#1e3a5f]">
            <button
              type="button"
              onClick={() => onEditPerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-white/5 text-gray-300 hover:bg-white/10 rounded transition-colors"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => onDeletePerson(person.id)}
              className="flex-1 text-xs py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded transition-colors"
            >
              Supprimer
            </button>
          </div>
        </div>
      )}
    </aside>
  )
}
