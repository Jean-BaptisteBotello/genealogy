import Link from 'next/link'
import { BRAND_NAME } from '../lib/brand'

export function LandingFooter() {
  return (
    <footer
      className="px-6 pt-10 pb-8 md:px-14 md:pt-14 md:pb-9"
      style={{
        background: '#f4f1ea',
        borderRadius: 14,
        border: '1px solid rgba(0,0,0,.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Grid */}
      <div
        className="grid grid-cols-2 gap-8 mb-10 md:grid-cols-[2fr_1fr_1fr_1fr] md:gap-12 md:mb-12"
      >
        {/* Column 1 — Brand */}
        <div className="col-span-2 md:col-span-1">
          <div
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: 36,
              lineHeight: 1,
              color: '#1a1815',
              marginBottom: 14,
              fontWeight: 400,
            }}
          >
            {BRAND_NAME}
            <span style={{ color: '#7c3aed' }}>.</span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              fontStyle: 'italic',
              fontSize: 16,
              color: '#4a4641',
              lineHeight: 1.45,
              maxWidth: 320,
            }}
          >
            Retrouvez les biens oubliés de votre famille — sans recopier un seul champ.
          </div>
        </div>

        {/* Column 2 — Produit */}
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#6b6760',
              fontWeight: 600,
              margin: '0 0 18px',
            }}
          >
            Produit
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <li>
              <a href="#comment-ca-marche" style={linkStyle}>Comment ça marche</a>
            </li>
            <li>
              <a href="#formulaires" style={linkStyle}>Les formulaires</a>
            </li>
            <li>
              <a href="#faq" style={linkStyle}>FAQ</a>
            </li>
            <li>
              <a href="#" style={linkStyle}>Roadmap</a>
            </li>
          </ul>
        </div>

        {/* Column 3 — Sources officielles */}
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#6b6760',
              fontWeight: 600,
              margin: '0 0 18px',
            }}
          >
            Sources officielles
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <li>
              <a
                href="https://www.service-public.gouv.fr/particuliers/vosdroits/F17759"
                target="_blank"
                rel="noopener"
                style={linkStyle}
              >
                service-public.gouv.fr
                <small style={smallStyle}>Renseignements immobiliers</small>
              </a>
            </li>
            <li>
              <a
                href="https://www.impots.gouv.fr/formulaire/3236-sd/demande-de-copie-de-documents-pour-la-periode-compter-du-1er-janvier-1956"
                target="_blank"
                rel="noopener"
                style={linkStyle}
              >
                impots.gouv.fr
                <small style={smallStyle}>Cerfa 3236-SD</small>
              </a>
            </li>
            <li>
              <a
                href="https://www.service-public.gouv.fr/particuliers/vosdroits/R47483"
                target="_blank"
                rel="noopener"
                style={linkStyle}
              >
                service-public.gouv.fr
                <small style={smallStyle}>Cerfa 3233-SD (R47483)</small>
              </a>
            </li>
          </ul>
        </div>

        {/* Column 4 — Légal */}
        <div>
          <h3
            style={{
              fontFamily: 'var(--font-inter, Inter, sans-serif)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.14em',
              color: '#6b6760',
              fontWeight: 600,
              margin: '0 0 18px',
            }}
          >
            Légal
          </h3>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
            <li>
              <a href="#" style={linkStyle}>Mentions légales</a>
            </li>
            <li>
              <Link href="/privacy" style={linkStyle}>Politique de confidentialité</Link>
            </li>
            <li>
              <a href="#" style={linkStyle}>CGU</a>
            </li>
            <li>
              <a href="#" style={linkStyle}>RGPD</a>
            </li>
          </ul>
        </div>
      </div>

      {/* Footer bottom */}
      <div
        className="flex flex-col gap-3 pt-7 md:flex-row md:justify-between md:items-center md:gap-0"
        style={{
          borderTop: '1px solid rgba(0,0,0,.08)',
          fontSize: 11,
          color: '#6b6760',
        }}
      >
        <div>© 2026 Genealogy · Hébergé en Allemagne (Frankfurt) · RGPD</div>
        <div style={{ display: 'flex', gap: 22 }}>
          <a href="mailto:contact@genealogy.fr" style={{ color: '#6b6760', textDecoration: 'none' }}>
            contact@genealogy.fr
          </a>
          <a href="#" style={{ color: '#6b6760', textDecoration: 'none' }}>
            Twitter
          </a>
        </div>
        <div
          style={{
            fontFamily: 'var(--font-instrument-serif)',
            fontStyle: 'italic',
            color: '#4a4641',
            fontSize: 12,
          }}
        >
          Fait avec soin en France ·
        </div>
      </div>
    </footer>
  )
}

const linkStyle: React.CSSProperties = {
  fontSize: 13,
  color: '#1a1815',
  textDecoration: 'none',
  lineHeight: 1.4,
  display: 'block',
}

const smallStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 10,
  color: '#6b6760',
  marginTop: 2,
}
