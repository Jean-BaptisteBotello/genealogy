'use client'
import { useState, useMemo } from 'react'
import type { SPF } from '@/lib/spf-directory'
import { SPFSelector } from './SPFSelector'
import { fill3236PDF, downloadPDF, type Formalite } from '@/lib/pdf-filler'
import {
  loadDemandeurProfile,
  saveDemandeurProfile,
  isProfileComplete,
  type DemandeurProfile,
} from '@/lib/demandeur-profile'

interface Formulaire3236ModalProps {
  onClose: () => void
  onSwitch3233: () => void
}

type Step = 'guidance' | 'form'

const EMPTY_FORMALITE: Formalite = { nature: '', date: '', sages: '', volume: '', numero: '' }

const inputStyle = {
  background: 'var(--card-bg, #fff)',
  border: '1px solid var(--border, #e5e2dd)',
  color: 'var(--text-primary)',
}

export function Formulaire3236Modal({ onClose, onSwitch3233 }: Formulaire3236ModalProps) {
  const [step, setStep] = useState<Step>('guidance')
  const [spf, setSPF] = useState<SPF | null>(null)
  const [formalites, setFormalites] = useState<Formalite[]>([{ ...EMPTY_FORMALITE }])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [demandeur, setDemandeur] = useState<DemandeurProfile>(() => loadDemandeurProfile())
  const [showDemandeurForm, setShowDemandeurForm] = useState(() => !isProfileComplete(loadDemandeurProfile()))

  const updateDemandeur = (field: keyof DemandeurProfile, value: string) => {
    setDemandeur(prev => {
      const next = { ...prev, [field]: value }
      saveDemandeurProfile(next)
      return next
    })
  }

  const updateFormalite = (index: number, field: keyof Formalite, value: string) => {
    setFormalites(prev => prev.map((f, i) => i === index ? { ...f, [field]: value } : f))
  }

  const addFormalite = () => {
    if (formalites.length < 7) setFormalites(prev => [...prev, { ...EMPTY_FORMALITE }])
  }

  const removeFormalite = (index: number) => {
    if (formalites.length > 1) setFormalites(prev => prev.filter((_, i) => i !== index))
  }

  const hasValidFormalite = formalites.some(f => f.volume.trim() && f.numero.trim())

  const canGenerate = useMemo(
    () => Boolean(spf && hasValidFormalite && isProfileComplete(demandeur)),
    [spf, hasValidFormalite, demandeur]
  )

  const cost = useMemo(() => {
    const nbBordereaux = formalites.filter(f => f.volume.trim() && f.numero.trim()).length
    const expeditionCourriel = !!demandeur.courriel
    const bordereaux = nbBordereaux * 6
    const expedition = expeditionCourriel ? 0 : nbBordereaux * 1
    return { nbBordereaux, bordereaux, expedition, total: bordereaux + expedition }
  }, [formalites, demandeur.courriel])

  const handleGenerate = async () => {
    if (!spf) return
    setIsGenerating(true)
    setError(null)
    try {
      const validFormalites = formalites.filter(f => f.volume.trim() && f.numero.trim())
      const bytes = await fill3236PDF({
        demandeur,
        formalites: validFormalites,
        spfName: spf.nom,
      })
      const first = validFormalites[0]
      const filename = `cerfa-3236_vol${first.volume}_n${first.numero}.pdf`.replace(/\s+/g, '-')
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
              Demande de copie d'actes publiés au SPF
            </p>
          </div>
          <button type="button" onClick={onClose} className="text-lg leading-none" style={{ color: 'var(--text-secondary)' }} aria-label="Fermer">
            ×
          </button>
        </div>

        {step === 'guidance' ? (
          <div className="p-6 flex flex-col gap-5">
            <div
              className="p-4 rounded-lg text-sm leading-relaxed"
              style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
            >
              <p className="font-medium mb-2">Ce formulaire nécessite des références précises</p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Pour obtenir une copie d'acte publié, vous devez connaître le <strong>volume</strong> et le{' '}
                <strong>numéro</strong> de l'acte dans les registres du SPF. Ces références vous sont communiquées
                dans la réponse à un formulaire 3233.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStep('form')}
                className="px-4 py-3 text-sm font-medium rounded-lg transition-colors"
                style={{ background: 'var(--accent, #7c3aed)', color: '#fff' }}
              >
                J'ai les références
              </button>
              <button
                type="button"
                onClick={onSwitch3233}
                className="px-4 py-3 text-sm rounded-lg transition-colors"
                style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}
              >
                ← Commencer par un 3233
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="p-6 flex flex-col gap-5">
              {/* Demandeur */}
              <section>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                    1. Vos coordonnées
                  </label>
                  {isProfileComplete(demandeur) && (
                    <button type="button" onClick={() => setShowDemandeurForm(v => !v)} className="text-[10px] underline" style={{ color: 'var(--text-secondary)' }}>
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

              {/* Formalités */}
              <section>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  2. Références des documents ({formalites.length}/7)
                </label>
                <div className="flex flex-col gap-3">
                  {formalites.map((f, i) => (
                    <div key={i} className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)' }}>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                          Formalité {i + 1}
                        </span>
                        {formalites.length > 1 && (
                          <button type="button" onClick={() => removeFormalite(i)} className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                            ✕ Retirer
                          </button>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <input type="text" placeholder="Volume *" value={f.volume}
                          onChange={e => updateFormalite(i, 'volume', e.target.value)}
                          className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                        <input type="text" placeholder="Numéro *" value={f.numero}
                          onChange={e => updateFormalite(i, 'numero', e.target.value)}
                          className="px-3 py-2 text-sm rounded-lg outline-none" style={inputStyle} />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Nature" value={f.nature}
                          onChange={e => updateFormalite(i, 'nature', e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} />
                        <input type="text" placeholder="Date formalité" value={f.date}
                          onChange={e => updateFormalite(i, 'date', e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} />
                        <input type="text" placeholder="N° SAGES / SPF" value={f.sages}
                          onChange={e => updateFormalite(i, 'sages', e.target.value)}
                          className="px-3 py-1.5 text-xs rounded-lg outline-none" style={inputStyle} />
                      </div>
                    </div>
                  ))}
                  {formalites.length < 7 && (
                    <button
                      type="button"
                      onClick={addFormalite}
                      className="text-xs font-medium py-2 rounded-lg transition-colors"
                      style={{ color: '#7c3aed', border: '1px dashed rgba(124,58,237,0.3)', background: 'rgba(124,58,237,0.03)' }}
                    >
                      + Ajouter une formalité
                    </button>
                  )}
                </div>
              </section>

              {/* SPF */}
              <section>
                <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                  3. Service de Publicité Foncière
                </label>
                <SPFSelector lieu={null} selectedSPF={spf} onSelect={setSPF} />
              </section>

              {/* Coût */}
              {hasValidFormalite && (
                <section>
                  <label className="text-xs font-medium uppercase tracking-wider mb-2 block" style={{ color: 'var(--text-secondary)' }}>
                    4. Coût estimé
                  </label>
                  <div
                    className="p-3 rounded-lg text-xs flex flex-col gap-1"
                    style={{ background: 'var(--card-bg, #fff)', border: '1px solid var(--border, #e5e2dd)', color: 'var(--text-secondary)' }}
                  >
                    <div className="flex justify-between">
                      <span>Bordereaux ({cost.nbBordereaux} × 6 €)</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cost.bordereaux} €</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Expédition{demandeur.courriel ? ' (courriel = gratuit)' : ` (${cost.nbBordereaux} × 1 €)`}</span>
                      <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{cost.expedition} €</span>
                    </div>
                    <div className="flex justify-between pt-1 mt-1 font-medium" style={{ borderTop: '1px solid var(--border, #e5e2dd)', color: 'var(--text-primary)' }}>
                      <span>Total</span>
                      <span>{cost.total} €</span>
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
              className="px-6 py-4 flex items-center justify-between gap-2 sticky bottom-0"
              style={{ background: 'var(--bg, #f8f8f6)', borderTop: '1px solid var(--border, #e5e2dd)' }}
            >
              <button type="button" onClick={() => setStep('guidance')} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                ← Retour
              </button>
              <div className="flex gap-2">
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
                  {isGenerating ? 'Génération…' : 'Générer le PDF'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
