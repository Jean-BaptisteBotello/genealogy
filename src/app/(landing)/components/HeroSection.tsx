import { HeroFormPreview } from './HeroFormPreview'
import { WaitlistForm } from './WaitlistForm'

export function HeroSection() {
  return (
    <section
      className="relative overflow-hidden rounded-[14px]"
      style={{
        background: '#f4f1ea',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.18)',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      <div
        className="grid gap-14 px-9 py-10 md:py-14"
        style={{ gridTemplateColumns: '1.35fr 1fr', alignItems: 'end', position: 'relative', zIndex: 2 }}
      >
        {/* Left column */}
        <div>
          {/* Eyebrow */}
          <div
            className="mb-7 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase"
            style={{ letterSpacing: '0.16em', color: '#4a4641', background: 'rgba(255,255,255,0.55)', borderColor: 'rgba(0,0,0,0.06)' }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#7c3aed' }} />
            Recherche foncière digitalisée
          </div>

          {/* H1 */}
          <h1
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: 92,
              lineHeight: 0.92,
              letterSpacing: '-0.025em',
              color: '#1a1815',
              margin: '0 0 28px',
              fontWeight: 400,
            }}
          >
            Et si votre famille
            <br />
            avait <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>oublié</em>
            <br />
            un bien&nbsp;?
          </h1>

          {/* Lede */}
          <p className="mb-8 text-[17px] leading-relaxed" style={{ color: '#4a4641', maxWidth: 480 }}>
            Genealogy digitalise les formulaires officiels du Service de Publicité Foncière pour
            vous aider à retrouver les biens immobiliers de votre famille — et leurs anciens
            propriétaires.
          </p>

          {/* Waitlist form */}
          <WaitlistForm source="hero" />

          {/* RGPD mention */}
          <p className="mt-2 text-xs" style={{ color: '#4a4641', paddingLeft: 18 }}>
            En vous inscrivant, vous acceptez notre{' '}
            <a href="/privacy" className="underline underline-offset-4" style={{ textDecorationColor: 'rgba(124,58,237,0.35)' }}>
              politique de confidentialité
            </a>
            .
          </p>

          {/* Micro-benefits */}
          <p className="mt-3 text-[12px]" style={{ color: '#7a7670', paddingLeft: 18, letterSpacing: '0.02em' }}>
            Pré-rempli depuis votre arbre · Guidé pas à pas · Envoyé sans imprimer
          </p>
        </div>

        {/* Right column — Form preview */}
        <div className="hidden md:block">
          <HeroFormPreview />
        </div>
      </div>

      {/* Footnote */}
      <div
        className="flex justify-between px-9 py-4 text-[11px] uppercase"
        style={{
          letterSpacing: '0.1em',
          color: '#8a8680',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <span>Données officielles SPF</span>
        <span style={{ color: '#1a1815' }}>100 services de publicité foncière couverts</span>
        <span>RGPD · Hébergement EU</span>
      </div>
    </section>
  )
}
