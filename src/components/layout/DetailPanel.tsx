// src/components/layout/DetailPanel.tsx
'use client'
import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getSignedUrl, uploadDocument, deleteDocument } from '@/server-actions/documents'
import type { Person, Branch, Relationship, PersonBranch, Document, SuggestionWithProposer } from '@/lib/types/database'
import type { SuggestionModalMode } from '@/components/suggestions/SuggestionModal'
import { useTree } from '@/lib/context/tree-context'
import { LinkPersonForm } from '@/components/person/LinkPersonForm'

interface DetailPanelProps {
  onClose: () => void
  persons: Person[]
  selectedPersonId: string | null
  personBranches: PersonBranch[]
  branches: Branch[]
  relationships: Relationship[]
  allPersons: Person[]
  documents: Record<string, unknown>
  onSelectPerson: (id: string | null) => void
  onEditPerson?: (id: string) => void
  onDeletePerson?: (id: string) => Promise<void>
  onShowToast?: (message: string, type?: 'error' | 'info') => void
  onProposeSuggestion?: (mode: SuggestionModalMode) => void
  pendingSuggestions?: SuggestionWithProposer[]
  currentRole?: 'ADMIN' | 'EDITOR' | 'VIEWER'
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
  onClose,
  persons,
  selectedPersonId,
  personBranches,
  branches,
  relationships,
  allPersons,
  onSelectPerson,
  onEditPerson,
  onDeletePerson,
  onShowToast,
  onProposeSuggestion,
  pendingSuggestions,
  currentRole: currentRoleProp,
}: DetailPanelProps) {
  const { currentRole: currentRoleCtx } = useTree()
  const currentRole = currentRoleProp ?? currentRoleCtx
  const [documents, setDocuments] = useState<Document[]>([])
  const [docsLoading, setDocsLoading] = useState(false)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [isUploading, startUpload] = useTransition()
  const [isLinking, setIsLinking] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const person = selectedPersonId ? persons.find(p => p.id === selectedPersonId) ?? null : null

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

  // Reset linking state when selected person changes
  useEffect(() => {
    setIsLinking(false)
  }, [selectedPersonId])

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

  if (!person) return null

  const personBranchIds = personBranches
    .filter(pb => pb.person_id === person.id)
    .map(pb => pb.branch_id)

  const personBranchList = branches.filter(b => personBranchIds.includes(b.id))

  const personRelationships = relationships.filter(
    r => r.person_a_id === person.id || r.person_b_id === person.id
  )

  function getOtherPerson(rel: Relationship): Person | undefined {
    const otherId =
      rel.person_a_id === person!.id ? rel.person_b_id : rel.person_a_id
    return allPersons.find(p => p.id === otherId)
  }

  return (
    <aside className="w-64 flex flex-col shrink-0 overflow-y-auto" style={{ background: 'var(--detail-bg)', borderLeft: '1px solid var(--detail-border)' }}>
      <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--divider)' }}>
        <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--section-label)' }}>Détail</span>
        <button type="button" onClick={onClose} className="text-xs" style={{ color: 'var(--text-muted)' }}>
          ✕
        </button>
      </div>

      <div className="p-3 flex flex-col gap-4 flex-1">
        {/* Identity */}
        <div>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            {person.prenom} {person.nom}
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
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
          {currentRole === 'VIEWER' && onProposeSuggestion && (
            <div className="flex gap-2 mt-2">
              <button type="button"
                onClick={() => onProposeSuggestion({ type: 'EDIT_PERSON', person })}
                className="text-xs text-blue-400 hover:text-blue-300">
                Proposer une modification
              </button>
              <button type="button"
                onClick={() => onProposeSuggestion({ type: 'DELETE_PERSON', person })}
                className="text-xs text-red-400 hover:text-red-300">
                Proposer la suppression
              </button>
            </div>
          )}
        </div>

        {/* Branches */}
        {personBranchList.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest mb-1">
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
        <div>
            <div className="flex items-center justify-between mb-1">
              <div className="text-[10px] uppercase tracking-widest">Relations</div>
              {currentRole !== 'VIEWER' && !isLinking && (
                <button
                  type="button"
                  title="Lier une personne"
                  onClick={() => setIsLinking(true)}
                  className="text-[10px] px-2 py-0.5 rounded font-medium transition-colors"
                  style={{ background: 'var(--accent-bg, rgba(60,30,45,0.06))', color: 'var(--accent-text, rgba(60,30,45,0.65))', border: '1px solid var(--divider, rgba(60,30,45,0.2))' }}
                >
                  + Lier
                </button>
              )}
              {currentRole !== 'VIEWER' && isLinking && (
                <button
                  type="button"
                  onClick={() => setIsLinking(false)}
                  className="text-[10px] text-gray-500 hover:text-gray-300"
                >
                  ✕
                </button>
              )}
            </div>

            {isLinking && (
              <LinkPersonForm
                currentPersonId={person.id}
                persons={allPersons}
                onClose={() => setIsLinking(false)}
              />
            )}

            {personRelationships.length > 0 && (
              <div className="flex flex-col gap-1">
                {personRelationships.map(rel => {
                  const other = getOtherPerson(rel)
                  if (!other) return null
                  const roleLabel =
                    (rel.metadata as { role?: string })?.role ??
                    RELATION_LABEL[rel.type] ??
                    rel.type
                  return (
                    <div key={rel.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => onSelectPerson(other.id)}
                        className="text-left text-xs py-0.5 flex items-center gap-1 flex-1 min-w-0"
                        style={{ color: 'var(--text-link, #93c5fd)' }}
                      >
                        <span className="text-[10px] text-gray-600 mr-1">{roleLabel}</span>
                        {other.prenom} {other.nom}
                      </button>
                      {currentRole === 'VIEWER' && onProposeSuggestion && (
                        <button type="button"
                          onClick={() => onProposeSuggestion({ type: 'DELETE_RELATIONSHIP', relationship: rel, persons: allPersons })}
                          className="text-xs text-gray-600 hover:text-red-400 ml-2">✕</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        {/* Pending suggestions for ADMIN/EDITOR */}
        {currentRole !== 'VIEWER' && pendingSuggestions && pendingSuggestions.length > 0 && (
          <div className="mt-4 border-t border-[var(--divider)]/40 pt-3">
            <p className="text-[10px] uppercase tracking-widest mb-2">
              {pendingSuggestions.length} suggestion{pendingSuggestions.length > 1 ? 's' : ''} en attente
            </p>
            {pendingSuggestions.map(s => (
              <div key={s.id} className="text-xs text-gray-400 py-1 border-b border-[var(--divider)]/20 flex items-center justify-between">
                <span>{s.type} · {s.users?.email ?? s.suggested_by}</span>
              </div>
            ))}
            <p className="text-xs text-gray-600 mt-2 italic">Gérez-les depuis le panneau dans la barre du haut.</p>
          </div>
        )}

        {/* Documents */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="text-[10px] uppercase tracking-widest">Documents</div>
            {currentRole !== 'VIEWER' && (
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isUploading}
                className="text-[10px] px-2 py-0.5 rounded font-medium disabled:opacity-50 transition-colors"
                style={{ background: 'var(--accent-bg, rgba(60,30,45,0.06))', color: 'var(--accent-text, rgba(60,30,45,0.65))', border: '1px solid var(--divider, rgba(60,30,45,0.2))' }}
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
          <div className="flex gap-2 mt-auto pt-2 border-t border-[var(--divider)]">
            <button
              type="button"
              onClick={() => onEditPerson?.(person.id)}
              className="flex-1 text-xs py-1.5 rounded transition-colors"
              style={{ background: 'var(--accent-bg, rgba(60,30,45,0.06))', color: 'var(--accent-text, rgba(60,30,45,0.7))', border: '1px solid var(--divider, rgba(60,30,45,0.18))' }}
            >
              Modifier
            </button>
            {currentRole === 'ADMIN' && (
              <button
                type="button"
                onClick={() => onDeletePerson?.(person.id)}
                className="flex-1 text-xs py-1.5 rounded transition-colors"
                style={{ background: 'rgba(180,50,50,0.08)', color: 'rgba(180,50,50,0.75)', border: '1px solid rgba(180,50,50,0.18)' }}
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  )
}
