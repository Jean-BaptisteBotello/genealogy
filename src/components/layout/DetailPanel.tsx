// src/components/layout/DetailPanel.tsx
'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSignedUrl, uploadDocument, deleteDocument } from '@/server-actions/documents'
import type { Person, Branch, Relationship, PersonBranch, Document } from '@/lib/types/database'
import { useTree } from '@/lib/context/tree-context'

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
  onShowToast?: (message: string, type?: 'error' | 'info') => void
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

const DOC_TYPE_LABEL: Record<string, string> = {
  ACTE_NAISSANCE: 'Acte de naissance',
  ACTE_MARIAGE: 'Acte de mariage',
  ACTE_DECES: 'Acte de décès',
  AUTRE: 'Autre',
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
  onShowToast,
}: DetailPanelProps) {
  const { currentRole } = useTree()
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Load documents when selected person changes
  useEffect(() => {
    if (!person) {
      setDocuments([])
      return
    }
    setDocsLoading(true)
    const supabase = createClient()
    supabase
      .from('document')
      .select('*')
      .eq('person_id', person.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setDocuments((data ?? []) as Document[])
        setDocsLoading(false)
      })
  }, [person?.id])

  async function handleDownload(doc: Document) {
    setDownloadingId(doc.id)
    const result = await getSignedUrl(doc.url_stockage)
    setDownloadingId(null)
    if (result.url) {
      window.open(result.url, '_blank', 'noopener,noreferrer')
    } else if (result.error) {
      onShowToast?.(result.error, 'error')
    }
  }

  function handleUploadClick() {
    fileInputRef.current?.click()
  }

  function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !person) return
    // Reset input so same file can be re-selected
    e.target.value = ''

    startUpload(async () => {
      const form = new FormData()
      form.set('person_id', person.id)
      form.set('nom', file.name.replace(/\.pdf$/i, ''))
      form.set('type', 'AUTRE')
      form.set('file', file)
      const result = await uploadDocument(form)
      if (result.error) {
        onShowToast?.(result.error, 'error')
      } else {
        // Reload documents list
        const supabase = createClient()
        const { data } = await supabase
          .from('document')
          .select('*')
          .eq('person_id', person.id)
          .order('created_at', { ascending: false })
        setDocuments((data ?? []) as Document[])
      }
    })
  }

  async function handleDeleteDoc(doc: Document) {
    if (!confirm(`Supprimer « ${doc.nom} » ?`)) return
    const result = await deleteDocument(doc.id, doc.url_stockage)
    if (result.error) {
      onShowToast?.(result.error, 'error')
    } else {
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    }
  }

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
              <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Relations</div>
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
                      <span className="text-[10px] text-gray-600 mr-1">
                        {RELATION_LABEL[rel.type] ?? rel.type}
                      </span>
                      {other.prenom} {other.nom}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Documents */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] text-gray-600 uppercase tracking-widest">Documents</div>
              {currentRole !== 'VIEWER' && (
                <button
                  type="button"
                  onClick={handleUploadClick}
                  disabled={isUploading}
                  className="text-[10px] text-gray-600 hover:text-gray-300 disabled:opacity-50"
                  title="Ajouter un document PDF"
                >
                  {isUploading ? '…' : '+ PDF'}
                </button>
              )}
            </div>
            {/* Hidden file input — PDF only */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelected}
            />
            {docsLoading ? (
              <p className="text-xs text-gray-600 animate-pulse">Chargement…</p>
            ) : documents.length === 0 ? (
              <p className="text-xs text-gray-600 italic">Aucun document</p>
            ) : (
              <div className="flex flex-col gap-1">
                {documents.map(doc => (
                  <div key={doc.id} className="flex items-center gap-1">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{doc.nom}</p>
                      <p className="text-[10px] text-gray-600">
                        {DOC_TYPE_LABEL[doc.type] ?? doc.type} ·{' '}
                        {(doc.taille_bytes / 1024).toFixed(0)} ko
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      disabled={downloadingId === doc.id}
                      className="text-[10px] text-blue-400 hover:text-blue-200 shrink-0 disabled:opacity-50"
                      title="Télécharger"
                    >
                      {downloadingId === doc.id ? '…' : '⬇'}
                    </button>
                    {currentRole === 'ADMIN' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteDoc(doc)}
                        className="text-[10px] text-gray-600 hover:text-red-400 shrink-0"
                        title="Supprimer"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          {currentRole !== 'VIEWER' && (
            <div className="flex gap-2 mt-auto pt-2 border-t border-[#1e3a5f]">
              <button
                type="button"
                onClick={() => onEditPerson(person.id)}
                className="flex-1 text-xs py-1.5 bg-white/5 text-gray-300 hover:bg-white/10 rounded transition-colors"
              >
                Modifier
              </button>
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => onDeletePerson(person.id)}
                  className="flex-1 text-xs py-1.5 bg-red-900/20 text-red-400 hover:bg-red-900/40 rounded transition-colors"
                >
                  Supprimer
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </aside>
  )
}
