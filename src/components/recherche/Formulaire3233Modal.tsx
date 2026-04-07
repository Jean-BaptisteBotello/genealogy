'use client'
import { useState, useMemo, useEffect } from 'react'
import type { Person } from '@/lib/types/database'
import type { SPF } from '@/lib/spf-directory'
import { PersonSelector } from './PersonSelector'
import { SPFSelector } from './SPFSelector'
import { fill3233PDF, downloadPDF } from '@/lib/pdf-filler'

interface Formulaire3233ModalProps {
  persons: Person[]
  initialPerson?: Person | null
  onClose: () => void
}

type TypeRecherche = 'personne' | 'immeuble'

export function Formulaire3233Modal({ persons, initialPerson, onClose }: Formulaire3233ModalProps) {
  const [person, setPerson] = useState<Person | null>(initialPerson ?? null)
  const [spf, setSPF] = useState<SPF | null>(null)
  const [typeRecherche, setTypeRecherche] = useState<TypeRecherche>('personne')
  const [commune, setCommune] = useState('')
  const [section, setSection] = useState('')
  const [parcelle, setParcelle] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Reset SPF when person changes so auto-detect re-runs
  useEffect(() => {
    setSPF(null)
  }, [person?.id])

  const canGenerate = useMemo(() => {
    if (!person || !spf) return false
    if (typeRecherche === 'immeuble' && !commune.trim()) return false
    return true
  }, [person, spf, typeRecherche, commune])

  const handleGenerate = async () => {
    if (!person || !spf) return
    setIsGenerating(true)
    setError(null)
    try {
      const bytes = await fill3233PDF({
        nom: person.nom,
        prenoms: person.prenom,
        dateNaissance: person.date_naissance,
        lieuNaissance: person.lieu_naissance,
        dateDeces: person.date_deces,
        lieuDeces: person.lieu_deces,
        typeRecherche,
        commune: commune || undefined,
        section: section || undefined,
        parcelle: parcelle || undefined,
      })
      const filename = `cerfa-3233_${person.nom}_${person.prenom}.pdf`.replace(/\s+/g, '-')
      downloadPDF(bytes, filename)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur lors de la génération du PDF')
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div
        className="rounded-xl w-full max-w-xl max-h-[90vh] overflow-y-auto flex flex-col"
        style={{ background: 'var(--bg, #f8f8f6)', border: '1px solid var(--border, #e5e2dd)' }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-start justify-between sticky top-0 z-10"
          style={{ background: 'var(--bg, #f8f8f6)', borderBottom: '1px solid var(--border, #e5e2dd)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Formulaire 3233 — Renseignements immobiliers
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Demande adressée au Service de Publicité Foncière
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-lg leading-none"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              1. Personne concernée
            </label>
            <PersonSelector persons={persons} selectedPerson={person} onSelect={setPerson} />
          </section>

          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              2. Type de recherche
            </label>
            <div className="flex gap-2">
              {(['personne', 'immeuble'] as TypeRecherche[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeRecherche(t)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors"
                  style={{
                    background:
                      typeRecherche === t
                        ? 'var(--accent, #7c3aed)'
                        : 'var(--card-bg, #fff)',
                    color: typeRecherche === t ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border, #e5e2dd)',
                  }}
                >
                  {t === 'personne' ? '👤 Par personne' : '🏠 Par immeuble'}
                </button>
              ))}
            </div>
          </section>

          {typeRecherche === 'immeuble' && (
            <section className="grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Commune *"
                value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
              />
              <input
                type="text"
                placeholder="Section"
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
              />
              <input
                type="text"
                placeholder="Parcelle"
                value={parcelle}
                onChange={(e) => setParcelle(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
              />
            </section>
          )}

          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              3. Service de Publicité Foncière
            </label>
            <SPFSelector
              lieu={person?.lieu_naissance ?? person?.lieu_deces ?? null}
              selectedSPF={spf}
              onSelect={setSPF}
            />
          </section>

          {person && (
            <section>
              <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                4. Données pré-remplies
              </label>
              <div
                className="p-3 rounded-lg text-xs grid grid-cols-2 gap-2"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-secondary)' }}
              >
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Nom :</span> {person.nom}</div>
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Prénoms :</span> {person.prenom}</div>
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Naissance :</span> {person.date_naissance ?? '—'}</div>
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Lieu :</span> {person.lieu_naissance ?? '—'}</div>
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Décès :</span> {person.date_deces ?? '—'}</div>
                <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Lieu :</span> {person.lieu_deces ?? '—'}</div>
              </div>
            </section>
          )}

          {error && (
            <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-4 flex items-center justify-end gap-2 sticky bottom-0"
          style={{ background: 'var(--bg, #f8f8f6)', borderTop: '1px solid var(--border, #e5e2dd)' }}
        >
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate || isGenerating}
            className="px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'var(--accent, #7c3aed)', color: '#fff' }}
          >
            {isGenerating ? 'Génération…' : '📄 Générer le PDF'}
          </button>
        </div>
      </div>
    </div>
  )
}
