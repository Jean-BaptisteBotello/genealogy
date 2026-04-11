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
      {children}
    </div>
  )
}
