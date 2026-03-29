// src/components/layout/Topbar.tsx
'use client'
import { signout } from '@/server-actions/auth'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface TopbarProps {
  userEmail: string
  activeView?: View
  onViewChange?: (view: View) => void
  onAddPerson?: () => void
  onProposePerson?: () => void
  onSearchOpen?: () => void
  pendingSuggestionsCount?: number
  onSuggestionsOpen?: () => void
  onMySuggestionsOpen?: () => void
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'cosmos', label: 'Cosmos', icon: '🌌' },
  { id: 'sablier', label: 'Sablier', icon: '⧖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'carte', label: 'Carte', icon: '🗺' },
]

export function Topbar({
  userEmail,
  activeView = 'cosmos',
  onViewChange,
  onAddPerson,
  onProposePerson,
  onSearchOpen,
  pendingSuggestionsCount,
  onSuggestionsOpen,
  onMySuggestionsOpen,
}: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="h-12 flex items-center px-4 gap-4 shrink-0" style={{ background: 'var(--topbar-bg)', borderBottom: '1px solid var(--topbar-border)' }}>
      <div className="font-bold text-sm tracking-widest uppercase mr-2" style={{ color: 'var(--topbar-text)' }}>
        🌳 Généalogie
      </div>
      <nav className="flex items-center gap-1">
        {VIEWS.map(view => (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange?.(view.id)}
            aria-pressed={activeView === view.id}
            className="px-3 py-1.5 rounded text-xs transition-colors"
            style={{
              background: activeView === view.id ? 'var(--accent-hover)' : 'transparent',
              color: activeView === view.id ? 'var(--text-primary)' : 'var(--text-secondary)',
            }}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      {onAddPerson && (
        <button
          type="button"
          onClick={onAddPerson}
          className="px-3 py-1.5 bg-red-500 text-white rounded text-xs hover:bg-red-600 transition-colors"
        >
          + Ajouter
        </button>
      )}
      {onProposePerson && (
        <button
          type="button"
          onClick={onProposePerson}
          className="px-3 py-1.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded text-xs hover:bg-blue-500/30 transition-colors"
        >
          + Proposer
        </button>
      )}
      {onSuggestionsOpen && (
        <button
          type="button"
          onClick={onSuggestionsOpen}
          className="relative text-gray-500 hover:text-gray-300 text-sm"
          aria-label="Suggestions en attente"
        >
          💡
          {(pendingSuggestionsCount ?? 0) > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] rounded-full w-4 h-4 flex items-center justify-center">
              {(pendingSuggestionsCount ?? 0) > 9 ? '9+' : pendingSuggestionsCount}
            </span>
          )}
        </button>
      )}
      {onMySuggestionsOpen && (
        <button
          type="button"
          onClick={onMySuggestionsOpen}
          className="text-gray-500 hover:text-gray-300 text-xs"
          aria-label="Mes propositions"
        >
          📋
        </button>
      )}
      <button
        type="button"
        onClick={onSearchOpen}
        className="text-sm transition-colors"
        style={{ color: 'var(--text-secondary)' }}
        aria-label="Rechercher"
      >
        🔍
      </button>
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
  )
}
