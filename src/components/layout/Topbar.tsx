'use client'
import { signout } from '@/server-actions/auth'

type View = 'cosmos' | 'sablier' | 'timeline' | 'carte' | 'eventail'

interface TopbarProps {
  userEmail: string
  activeView?: View
  onViewChange?: (view: View) => void
}

const VIEWS: { id: View; label: string; icon: string }[] = [
  { id: 'cosmos', label: 'Cosmos', icon: '🌌' },
  { id: 'sablier', label: 'Sablier', icon: '⧖' },
  { id: 'timeline', label: 'Timeline', icon: '📅' },
  { id: 'carte', label: 'Carte', icon: '🗺' },
  { id: 'eventail', label: 'Éventail', icon: '🌀' },
]

export function Topbar({ userEmail, activeView = 'cosmos', onViewChange }: TopbarProps) {
  const initials = userEmail.slice(0, 2).toUpperCase() || '?'

  return (
    <header className="h-12 bg-[#0d1117] border-b border-[#1e3a5f] flex items-center px-4 gap-4 shrink-0">
      <div className="text-red-500 font-bold text-sm tracking-widest uppercase mr-2">
        🌳 Généalogie
      </div>
      <nav className="flex items-center gap-1">
        {VIEWS.map(view => (
          <button
            key={view.id}
            type="button"
            onClick={() => onViewChange?.(view.id)}
            aria-pressed={activeView === view.id}
            className={[
              'px-3 py-1.5 rounded text-xs transition-colors',
              activeView === view.id
                ? 'bg-white/10 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5',
            ].join(' ')}
          >
            {view.icon} {view.label}
          </button>
        ))}
      </nav>
      <div className="flex-1" />
      <button type="button" className="px-3 py-1.5 bg-red-500/20 text-red-400 border border-red-500/30 rounded text-xs hover:bg-red-500/30 transition-colors">
        + Ajouter
      </button>
      <button type="button" className="text-gray-500 hover:text-gray-300 text-sm">🔍</button>
      <form action={signout}>
        <button
          type="submit"
          className="w-7 h-7 rounded-full bg-[#1e3a5f] text-[#7ec8e3] text-xs font-bold flex items-center justify-center hover:bg-[#2a4f7f] transition-colors"
          title={`Déconnexion (${userEmail})`}
        >
          {initials}
        </button>
      </form>
    </header>
  )
}
