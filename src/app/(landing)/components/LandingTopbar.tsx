import Link from 'next/link'
import { BRAND_NAME } from '../lib/brand'

interface LandingTopbarProps {
  isAuthenticated: boolean
}

export function LandingTopbar({ isAuthenticated }: LandingTopbarProps) {
  return (
    <header
      className="flex items-center justify-between px-9 py-5"
      style={{ position: 'relative', zIndex: 10 }}
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
        <a
          href="#waitlist"
          className="rounded-full border px-4 py-2 text-xs font-medium"
          style={{ borderColor: '#1a1815', color: '#1a1815' }}
        >
          Rejoindre la waitlist →
        </a>
      )}
    </header>
  )
}
