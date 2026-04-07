'use client'
import { useState, useMemo, useEffect } from 'react'
import type { Person } from '@/lib/types/database'
import type { SPF } from '@/lib/spf-directory'
import { PersonSelector } from './PersonSelector'
import { SPFSelector } from './SPFSelector'
import { fill3236PDF, downloadPDF } from '@/lib/pdf-filler'

interface Formulaire3236ModalProps {
  persons: Person[]
  initialPerson?: Person | null
  onClose: () => void
  onSwitch3233: () => void
}

type Step = 'guidance' | 'form'

export function Formulaire3236Modal({ persons, initialPerson, onClose, onSwitch3233 }: Formulaire3236ModalProps) {
  const [step, setStep] = useState<Step>('guidance')
  const [person, setPerson] = useState<Person | null>(initialPerson ?? null)
  const [spf, setSPF] = useState<SPF | null>(null)
  const [volume, setVolume] = useState('')
  const [numero, setNumero] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setSPF(null)
  }, [person?.id])

  const canGenerate = useMemo(
    () => Boolean(person && spf && volume.trim() && numero.trim()),
    [person, spf, volume, numero]
  )

  const handleGenerate = async () => {
    if (!person || !spf) return
    setIsGenerating(true)
    setError(null)
    try {
      const bytes = await fill3236PDF({
        nom: person.nom,
        prenoms: person.prenom,
        dateNaissance: person.date_naissance,
        lieuNaissance: person.lieu_naissance,
        dateDeces: person.date_deces,
        lieuDeces: person.lieu_deces,
        volume: volume.trim(),
        numero: numero.trim(),
      })
      const filename = `cerfa-3236_${person.nom}_${person.prenom}.pdf`.replace(/\s+/g, '-')
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
              Formulaire 3236 — Copie de documents fonciers
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>
              Demande d'une copie d'acte publié
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

        {step === 'guidance' ? (
          <div className="p-6 flex flex-col gap-5">
            <div
              className="p-4 rounded-lg text-sm leading-relaxed"
              style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
            >
              <p className="font-medium mb-2">⚠️ Ce formulaire nécessite des références précises</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Pour obtenir une copie d'acte publié, vous devez connaître le <strong>volume</strong> et le{' '}
                <strong>numéro</strong> de l'acte dans les registres du SPF. Si vous ne les avez pas, commencez
                par envoyer un formulaire 3233 (renseignements) qui vous retournera ces références.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-3 text-sm font-medium rounded-lg transition-colors"
                style={{ background: 'var(--accent, #7c3aed)', color: '#fff' }}
              >
                ✓ Oui, j'ai les références
              </button>
              <button
                type="button"
                onClick={onSwitch3233}
                className="px-4 py-3 text-sm rounded-lg transition-colors"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
              >
                ← Non, commencer par un 3233
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 flex flex-col gap-5">
              <section>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  1. Personne concernée
                </label>
                <PersonSelector persons={persons} selectedPerson={person} onSelect={setPerson} />
              </section>

              <section>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  2. Références de l'acte
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Volume *"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
                  />
                  <input
                    type="text"
                    placeholder="Numéro *"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg outline-none"
                    style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
                  />
                </div>
              </section>

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
                  </div>
                </section>
              )}

              {error && (
                <div className="text-xs px-3 py-2 rounded-lg" style={{ background: '#fee2e2', color: '#991b1b' }}>
                  {error}
                </div>
              )}
            </div>

            <div
              className="px-6 py-4 flex items-center justify-between gap-2 sticky bottom-0"
              style={{ background: 'var(--bg, #f8f8f6)', borderTop: '1px solid var(--border, #e5e2dd)' }}
            >
              <button
                type="button"
                onClick={() => setStep('guidance')}
                className="text-xs"
                style={{ color: 'var(--text-secondary)' }}
              >
                ← Retour
              </button>
              <div className="flex gap-2">
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
          </>
        )}
      </div>
    </div>
  )
}
