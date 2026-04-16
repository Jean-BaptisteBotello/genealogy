// src/components/layout/Topbar.tsx
'use client'
import { signout } from '@/server-actions/auth'
import { RechercheDropdown } from '@/components/recherche/RechercheDropdown'
import { CoachMark } from '@/components/onboarding/CoachMark'
import { FormPreviewCard } from '@/components/onboarding/FormPreviewCard'
import '@/components/onboarding/coach-mark.css'
import type { Person } from '@/lib/types/database'
import type { OnboardingStep } from '@/lib/hooks/useOnboarding'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface TopbarProps {
  userEmail: string
  activeView?: View
  onViewChange?: (view: View) => void
  selectedPerson?: Person | null
  onboardingStep?: OnboardingStep | null
  onOnboardingAdvance?: () => void
  onOnboardingSkip?: () => void
  firstPerson?: Person | null
  onAddPerson?: () => void
  onProposePerson?: () => void
  onSearchOpen?: () => void
  pendingSuggestionsCount?: number
  onSuggestionsOpen?: () => void
  onMySuggestionsOpen?: () => void
  onOpen3233?: () => void
  onOpen3236?: () => void
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'cosmos', label: 'Cosmos' },
  { id: 'sablier', label: 'Sablier' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'carte', label: 'Carte' },
]

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  )
}

function SuggestionsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2a7 7 0 015 11.9V17a1 1 0 01-1 1H8a1 1 0 01-1-1v-3.1A7 7 0 0112 2z" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  )
}

export function Topbar({
  userEmail,
  activeView = 'cosmos',
  onViewChange,
  selectedPerson,
  onboardingStep,
  onOnboardingAdvance,
  onOnboardingSkip,
  firstPerson,
  onAddPerson,
  onProposePerson,
  onSearchOpen,
  pendingSuggestionsCount,
  onSuggestionsOpen,
  onMySuggestionsOpen,
  onOpen3233,
  onOpen3236,
}: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase() || '?'
  const personInitials = selectedPerson
    ? (selectedPerson.prenom[0] ?? '') + (selectedPerson.nom[0] ?? '')
    : ''
  const personLabel = selectedPerson
    ? `${selectedPerson.prenom} ${selectedPerson.nom}`
    : ''
  const personDates = selectedPerson
    ? [
        selectedPerson.date_naissance ? new Date(selectedPerson.date_naissance).getFullYear() : null,
        selectedPerson.date_deces ? new Date(selectedPerson.date_deces).getFullYear() : null,
      ].filter(Boolean).join('–')
    : ''

  return (
    <div className="shrink-0" style={{ borderBottom: '1px solid var(--topbar-border)' }}>
      {/* Line 1 — Navigation */}
      <header
        className="h-12 flex items-center px-4 gap-3"
        style={{ background: 'var(--topbar-bg)' }}
      >
        {/* Logo */}
        <div className="font-bold text-xs tracking-widest uppercase mr-1 flex items-center gap-1.5" style={{ color: 'var(--topbar-text)' }}>
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: '#7c3aed' }}
          />
          Généalogie
        </div>

        {/* View pill group */}
        <nav
          className="flex rounded-lg p-0.5 gap-px"
          style={{ background: 'var(--pill-group-bg, #eae7e2)' }}
        >
          {VIEWS.map(view => (
            <button
              key={view.id}
              type="button"
              onClick={() => onViewChange?.(view.id)}
              aria-pressed={activeView === view.id}
              className="px-3.5 py-1 rounded-md text-xs font-medium transition-all"
              style={{
                background: activeView === view.id ? '#fff' : 'transparent',
                color: activeView === view.id ? 'var(--text-primary, #1a1a1a)' : 'var(--text-secondary, #8a8580)',
                boxShadow: activeView === view.id ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {view.label}
            </button>
          ))}
        </nav>

        <div className="flex-1" />

        {/* Right actions */}
        <button
          type="button"
          onClick={onSearchOpen}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          aria-label="Rechercher"
        >
          <SearchIcon />
        </button>

        {onOpen3233 && onOpen3236 && (
          <div className={onboardingStep === 2 ? 'coach-pulse' : ''} style={{ position: 'relative', borderRadius: 8 }}>
            <RechercheDropdown onOpen3233={onOpen3233} onOpen3236={onOpen3236} />
            {onboardingStep === 2 && onOnboardingAdvance && onOnboardingSkip && firstPerson && (
              <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 8, zIndex: 40 }}>
                <CoachMark
                  step={2}
                  totalSteps={4}
                  title="Le formulaire est déjà pré-rempli ✨"
                  description={`Cliquez sur Recherches pour voir le formulaire 3233 avec les données de ${firstPerson.prenom}.`}
                  ctaLabel="Voir le formulaire →"
                  onCtaClick={onOnboardingAdvance}
                  onSkip={onOnboardingSkip}
                  position="top"
                >
                  <FormPreviewCard person={firstPerson} />
                </CoachMark>
              </div>
            )}
          </div>
        )}

        <form action={signout}>
          <button
            type="submit"
            className="w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-colors"
            style={{ background: 'var(--avatar-bg)', color: 'var(--avatar-text)' }}
            title={`Déconnexion (${userEmail})`}
          >
            {initials}
          </button>
        </form>
      </header>

      {/* Line 2 — Context bar */}
      <div
        className="flex items-center px-4 gap-2.5"
        style={{
          height: selectedPerson ? 40 : 36,
          background: 'var(--card-bg, #fff)',
          borderTop: '1px solid var(--topbar-border, #e5e2dd)',
          position: 'relative',
        }}
      >
        {selectedPerson ? (
          <div
            className="flex items-center gap-1.5 px-1 pr-2.5 rounded-md text-xs font-medium"
            style={{
              background: 'rgba(124,58,237,0.06)',
              border: '1px solid rgba(124,58,237,0.15)',
              color: 'var(--text-primary, #1a1a1a)',
              height: 28,
            }}
          >
            <span
              className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold shrink-0"
              style={{ background: '#7c3aed', color: 'white' }}
            >
              {personInitials}
            </span>
            {personLabel}
            {personDates && (
              <span className="text-[10px] font-normal" style={{ color: 'var(--text-secondary, #8a8580)' }}>
                · {personDates}
              </span>
            )}
          </div>
        ) : (
          <span className="text-xs" style={{ color: 'var(--text-secondary, #8a8580)' }}>
            Aucune personne sélectionnée
          </span>
        )}

        <div className="flex-1" />

        {onAddPerson && (
          <button
            type="button"
            onClick={onAddPerson}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors${(onboardingStep === 1 || onboardingStep === 3) ? ' coach-pulse' : ''}`}
            style={{ background: '#7c3aed', color: 'white' }}
          >
            + Ajouter
          </button>
        )}
        {onboardingStep === 1 && onOnboardingSkip && onAddPerson && (
          <div style={{ position: 'absolute', top: '100%', right: 14, marginTop: 8, zIndex: 40 }}>
            <CoachMark
              step={1}
              totalSteps={4}
              title="Ajoutez votre premier ancêtre"
              description="Son nom pré-remplira automatiquement les formulaires de recherche foncière."
              ctaLabel="Ajouter →"
              onCtaClick={onAddPerson}
              onSkip={onOnboardingSkip}
              position="top"
            />
          </div>
        )}
        {onboardingStep === 3 && onOnboardingSkip && onAddPerson && firstPerson && (
          <div style={{ position: 'absolute', top: '100%', right: 14, marginTop: 8, zIndex: 40 }}>
            <CoachMark
              step={3}
              totalSteps={4}
              title="Complétez votre arbre"
              description={`Ajoutez le père ou la mère de ${firstPerson.prenom}. Plus votre arbre est riche, plus vos recherches seront précises.`}
              ctaLabel="Ajouter quelqu'un →"
              onCtaClick={onAddPerson}
              onSkip={onOnboardingSkip}
              position="top"
            />
          </div>
        )}
        {onProposePerson && (
          <button
            type="button"
            onClick={onProposePerson}
            className="px-3 py-1 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'rgba(124,58,237,0.08)',
              color: '#7c3aed',
              border: '1px solid rgba(124,58,237,0.2)',
            }}
          >
            + Proposer
          </button>
        )}
        {onSuggestionsOpen && (
          <button
            type="button"
            onClick={onSuggestionsOpen}
            className="relative w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Suggestions en attente"
          >
            <SuggestionsIcon />
            {(pendingSuggestionsCount ?? 0) > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[8px] rounded-full w-3.5 h-3.5 flex items-center justify-center font-bold">
                {(pendingSuggestionsCount ?? 0) > 9 ? '9+' : pendingSuggestionsCount}
              </span>
            )}
          </button>
        )}
        {onMySuggestionsOpen && (
          <button
            type="button"
            onClick={onMySuggestionsOpen}
            className="w-7 h-7 flex items-center justify-center rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            aria-label="Mes propositions"
          >
            <SuggestionsIcon />
          </button>
        )}
      </div>
    </div>
  )
}
