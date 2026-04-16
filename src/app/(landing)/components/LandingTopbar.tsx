import Link from 'next/link'
import { BRAND_NAME } from '../lib/brand'

interface LandingTopbarProps {
  isAuthenticated: boolean
}

export function LandingTopbar({ isAuthenticated }: LandingTopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-6 py-4 md:px-9 md:py-3"
      style={{
        position: 'sticky',
        top: 8,
        zIndex: 20,
        background: 'rgba(217, 212, 201, 0.72)',
        backdropFilter: 'saturate(140%) blur(10px)',
        WebkitBackdropFilter: 'saturate(140%) blur(10px)',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        borderRadius: 999,
        margin: '8px 0 0',
      }}
    >
      <div
        className="text-2xl"
        style={{ fontFamily: 'var(--font-instrument-serif)', color: '#1a1815' }}
      >
        {BRAND_NAME}
        <span style={{ color: '#7c3aed' }}>.</span>
      </div>
      <nav className="hidden md:flex items-center gap-8 text-sm" style={{ color: '#4a4641' }}>
        <a href="#comment-ca-marche">Comment ça marche</a>
        <a href="#formulaires">Les formulaires</a>
        <a href="#faq">FAQ</a>
      </nav>
      {isAuthenticated ? (
        <Link
          href="/tree"
          className="rounded-full border px-4 py-2 text-xs font-medium"
          style={{ borderColor: '#1a1815', color: '#1a1815' }}
        >
          Accéder à mon arbre →
        </Link>
      ) : (
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-xs font-medium transition-colors hover:opacity-70"
            style={{ color: '#1a1815' }}
          >
            Se connecter
          </Link>
          <a
            href="#waitlist"
            className="rounded-full border px-4 py-2 text-xs font-medium"
            style={{ borderColor: '#1a1815', color: '#1a1815' }}
          >
            Rejoindre la waitlist →
          </a>
        </div>
      )}
    </header>
  )
}
