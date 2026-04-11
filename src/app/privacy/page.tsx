import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Politique de confidentialité — Genealogy',
}

export default function PrivacyPage() {
  return (
    <main className="mx-auto px-6 py-16" style={{ maxWidth: 720, fontFamily: 'system-ui, sans-serif', color: '#1a1815', lineHeight: 1.7 }}>
      <h1 className="mb-8 text-3xl font-bold">Politique de confidentialité</h1>
      <p className="mb-4">Dernière mise à jour : avril 2026</p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Données collectées</h2>
      <p className="mb-4">Lorsque vous vous inscrivez à la waitlist, nous collectons uniquement votre adresse email. Cette donnée est utilisée exclusivement pour vous prévenir de l'ouverture du service.</p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Hébergement et sécurité</h2>
      <p className="mb-4">Vos données sont hébergées en Allemagne (Frankfurt) via Supabase, conforme au RGPD. Les données ne sont jamais transférées hors de l'Union Européenne.</p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Vos droits</h2>
      <p className="mb-4">Vous pouvez demander la suppression de vos données à tout moment en nous contactant à <a href="mailto:contact@genealogy.fr" className="underline">contact@genealogy.fr</a>.</p>
      <h2 className="mt-8 mb-3 text-xl font-semibold">Cookies</h2>
      <p>Ce site n'utilise pas de cookies de suivi ni d'analytics.</p>
    </main>
  )
}
