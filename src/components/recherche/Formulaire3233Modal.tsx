'use client'
import { useState, useMemo, useEffect } from 'react'
import type { Person } from '@/lib/types/database'
import type { SPF } from '@/lib/spf-directory'
import { PersonSelector } from './PersonSelector'
import { SPFSelector } from './SPFSelector'
import { fill3233PDF, downloadPDF, type PaymentMode } from '@/lib/pdf-filler'
import {
  loadDemandeurProfile,
  saveDemandeurProfile,
  isProfileComplete,
  type DemandeurProfile,
} from '@/lib/demandeur-profile'

interface Formulaire3233ModalProps {
  persons: Person[]
  initialPerson?: Person | null
  onClose: () => void
}

type TypeRecherche = 'personne' | 'immeuble'

const PAYMENT_OPTIONS: { value: PaymentMode; label: string }[] = [
  { value: 'carte', label: 'Carte bancaire' },
  { value: 'virement', label: 'Virement' },
  { value: 'cheque', label: 'Chèque' },
  { value: 'cheque_banque', label: 'Chèque de banque' },
  { value: 'numeraire', label: 'Numéraire' },
]

const inputStyle = {
  background: 'var(--card-bg, #fff)',
  border: '1px solid var(--border, #e5e2dd)',
  color: 'var(--text-primary)',
}

export function Formulaire3233Modal({ persons, initialPerson, onClose }: Formulaire3233ModalProps) {
  const [person, setPerson] = useState<Person | null>(initialPerson ?? null)
  const [spf, setSPF] = useState<SPF | null>(null)
  const [typeRecherche, setTypeRecherche] = useState<TypeRecherche>('personne')
  const [commune, setCommune] = useState('')
  const [section, setSection] = useState('')
  const [parcelle, setParcelle] = useState('')
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('carte')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [demandeur, setDemandeur] = useState<DemandeurProfile>(() => loadDemandeurProfile())
  const [showDemandeurForm, setShowDemandeurForm] = useState(false)

  useEffect(() => {
    if (!isProfileComplete(demandeur)) setShowDemandeurForm(true)
  }, [])

  useEffect(() => { setSPF(null) }, [person?.id])

  const updateDemandeur = (field: keyof DemandeurProfile, value: string) => {
    setDemandeur(prev => {
      const next = { ...prev, [field]: value }
      saveDemandeurProfile(next)
      return next
    })
  }

  const canGenerate = useMemo(() => {
    if (!person || !spf) return false
    if (typeRecherche === 'immeuble' && !commune.trim()) return false
    if (!isProfileComplete(demandeur)) return false
    return true
  }, [person, spf, typeRecherche, commune, demandeur])

  const cost = useMemo(() => {
    const expeditionCourriel = !!demandeur.courriel
    const base = 12
    const expedition = expeditionCourriel ? 0 : 2
    return { base, expedition, total: base + expedition }
  }, [demandeur.courriel])

  const handleGenerate = async () => {
    if (!person || !spf) return
    setIsGenerating(true)
    setError(null)
    try {
      const bytes = await fill3233PDF({
        demandeur,
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
        spfName: spf.nom,
        paymentMode,
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
          <button type="button" onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--text-secondary)' }} aria-label="Fermer">
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-5">
          {/* Demandeur */}
          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                1. Vos coordonnées
              </label>
              {isProfileComplete(demandeur) && (
                <button
                  type="button"
                  onClick={() => setShowDemandeurForm(v => !v)}
                  className="text-[10px] underline"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  {showDemandeurForm ? 'Masquer' : 'Modifier'}
                </button>
              )}
            </div>
            {showDemandeurForm ? (
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Nom et prénoms (MAJUSCULES) *" value={demandeur.identite}
                  onChange={e => updateDemandeur('identite', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                <input type="text" placeholder="Adresse — n° et rue *" value={demandeur.adresseLigne1}
                  onChange={e => updateDemandeur('adresseLigne1', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                <input type="text" placeholder="Complément d'adresse" value={demandeur.adresseLigne2}
                  onChange={e => updateDemandeur('adresseLigne2', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                <input type="text" placeholder="Code postal + Ville *" value={demandeur.adresseLigne3}
                  onChange={e => updateDemandeur('adresseLigne3', e.target.value)}
                  className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                <div className="grid grid-cols-2 gap-2">
                  <input type="email" placeholder="Courriel" value={demandeur.courriel}
                    onChange={e => updateDemandeur('courriel', e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                  <input type="tel" placeholder="Téléphone" value={demandeur.telephone}
                    onChange={e => updateDemandeur('telephone', e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                </div>
                <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  Sauvegardé localement — réutilisé pour vos prochains formulaires.
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-lg text-xs" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-secondary)' }}>
                <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{demandeur.identite}</span>
                {' — '}{demandeur.adresseLigne3}
                {demandeur.courriel && ` · ${demandeur.courriel}`}
              </div>
            )}
          </section>

          {/* Personne concernée */}
          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              2. Personne concernée
            </label>
            <PersonSelector persons={persons} selectedPerson={person} onSelect={setPerson} />
          </section>

          {/* Type de recherche */}
          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              3. Type de recherche
            </label>
            <div className="flex gap-2">
              {(['personne', 'immeuble'] as TypeRecherche[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTypeRecherche(t)}
                  className="flex-1 px-3 py-2 text-sm rounded-lg transition-colors"
                  style={{
                    background: typeRecherche === t ? 'var(--accent, #7c3aed)' : 'var(--card-bg, #fff)',
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
              <input type="text" placeholder="Commune *" value={commune}
                onChange={(e) => setCommune(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <input type="text" placeholder="Section" value={section}
                onChange={(e) => setSection(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
              <input type="text" placeholder="Parcelle" value={parcelle}
                onChange={(e) => setParcelle(e.target.value)}
                className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
            </section>
          )}

          {/* SPF */}
          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              4. Service de Publicité Foncière
            </label>
            <SPFSelector
              lieu={person?.lieu_naissance ?? person?.lieu_deces ?? null}
              selectedSPF={spf}
              onSelect={setSPF}
            />
          </section>

          {/* Mode de paiement */}
          <section>
            <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
              5. Mode de paiement
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PAYMENT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setPaymentMode(opt.value)}
                  className="px-3 py-1.5 text-xs rounded-lg transition-colors"
                  style={{
                    background: paymentMode === opt.value ? 'var(--accent, #7c3aed)' : 'var(--card-bg, #fff)',
                    color: paymentMode === opt.value ? '#fff' : 'var(--text-primary)',
                    border: '1px solid var(--border, #e5e2dd)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </section>

          {/* Récapitulatif */}
          {person && (
            <section>
              <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                6. Récapitulatif
              </label>
              <div
                className="p-3 rounded-lg text-xs flex flex-col gap-1.5"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-secondary)' }}
              >
                <div className="grid grid-cols-2 gap-1.5">
                  <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Nom :</span> {person.nom}</div>
                  <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Prénoms :</span> {person.prenom}</div>
                  <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Naissance :</span> {person.date_naissance ?? '—'}</div>
                  <div><span className="font-medium" style={{ color: 'var(--text-primary)' }}>Lieu :</span> {person.lieu_naissance ?? '—'}</div>
                </div>
                <div className="pt-1.5 mt-1.5" style={{ borderTop: '1px solid var(--border, #e5e2dd)' }}>
                  <div className="flex justify-between">
                    <span>Tarif demande (1 personne)</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cost.base} €</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Frais d'expédition{demandeur.courriel ? ' (courriel = gratuit)' : ' (courrier)'}</span>
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cost.expedition} €</span>
                  </div>
                  <div className="flex justify-between pt-1 mt-1 font-medium" style={{ borderTop: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}>
                    <span>Total</span>
                    <span>{cost.total} €</span>
                  </div>
                </div>
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
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
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
