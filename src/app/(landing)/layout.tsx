import type { Metadata } from 'next'
import { Instrument_Serif, Inter } from 'next/font/google'
import { BRAND_NAME } from './lib/brand'

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-instrument-serif',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: `${BRAND_NAME} — Retrouvez les biens oubliés de votre famille`,
  description:
    'Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour vous aider à retrouver les biens immobiliers de votre famille — et leurs anciens propriétaires.',
  openGraph: {
    title: `${BRAND_NAME} — Retrouvez les biens oubliés de votre famille`,
    description:
      'Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour retrouver les biens immobiliers de votre famille.',
  },
}

export default function LandingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${instrumentSerif.variable} ${inter.variable} font-[family-name:var(--font-inter)]`}
      style={{ background: '#d9d4c9', minHeight: '100vh' }}
    >
      <style>{`
        /* ── Responsive typography ── */
        .landing-h1 { font-size: 92px; }
        .landing-h2 { font-size: 64px; }
        .landing-h2-cta { font-size: 84px; }

        @media (max-width: 767px) {
          .landing-h1 { font-size: 44px; }
          .landing-h2 { font-size: 36px; }
          .landing-h2-cta { font-size: 38px; }
          .landing-faq-q { font-size: 20px !important; }
        }
      `}</style>
      {children}
    </div>
  )
}
