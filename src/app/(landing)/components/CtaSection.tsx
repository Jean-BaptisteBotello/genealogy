import { WaitlistForm } from './WaitlistForm'

export function CtaSection({
  isAuthenticated = false,
  waitlistCount,
}: {
  isAuthenticated?: boolean
  waitlistCount?: number
}) {
  return (
    <section
      id="waitlist"
      className="px-6 py-16 md:px-14 md:py-24 md:pb-[88px]"
      style={{
        background: '#e6dfcf',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,.18)',
        position: 'relative',
        textAlign: 'center',
      }}
    >
      {/* Dot texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(0,0,0,.05) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
          opacity: 0.55,
        }}
      />

      {/* Violet radial glow behind title */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 420,
          height: 420,
          background: 'radial-gradient(circle, rgba(124,58,237,.18), transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* Eyebrow */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: '#4a4641',
          background: 'rgba(255,255,255,.55)',
          padding: '7px 14px',
          borderRadius: 999,
          border: '1px solid rgba(0,0,0,.06)',
          marginBottom: 28,
          fontFamily: 'var(--font-inter)',
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#7c3aed',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        Rejoindre la waitlist
      </div>

      {/* H2 */}
      <h2
        className="landing-h2-cta"
        style={{
          position: 'relative',
          zIndex: 2,
          fontFamily: 'var(--font-instrument-serif)',
          fontWeight: 400,
          lineHeight: 0.94,
          letterSpacing: '-0.02em',
          margin: '0 auto 22px',
          color: '#1a1815',
          maxWidth: 920,
        }}
      >
        Et si vous étiez
        <br />
        les{' '}
        <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>premiers à savoir</em>
        <br />
        ce que votre famille a oublié&nbsp;?
      </h2>

      {/* Lede */}
      <p
        style={{
          position: 'relative',
          zIndex: 2,
          fontSize: 17,
          lineHeight: 1.55,
          color: '#4a4641',
          maxWidth: 540,
          margin: '0 auto 40px',
          fontFamily: 'var(--font-inter)',
        }}
      >
        Genealogy ouvrira en avant-première aux inscrits de la waitlist. Pas de spam,
        juste une notification quand ce sera prêt.
      </p>

      {/* Waitlist form (auth-aware) */}
      <div style={{ position: 'relative', zIndex: 2, display: 'flex', justifyContent: 'center' }}>
        <WaitlistForm source="cta" isAuthenticated={isAuthenticated} />
      </div>

      {/* Meta */}
      <p
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 18,
          fontSize: 12,
          color: '#7a7670',
          fontFamily: 'var(--font-inter)',
        }}
      >
        Vous serez prévenu·e dès l&apos;ouverture ·{' '}
        <strong style={{ color: '#7c3aed', fontWeight: 500 }}>
          Pas de carte bancaire requise
        </strong>
      </p>

      {/* Counters */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 56,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 32,
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'var(--font-instrument-serif)',
        }}
      >
        {typeof waitlistCount === 'number' && waitlistCount > 0 && (
          <>
            <div style={{ textAlign: 'center' }}>
              <div
                style={{ fontSize: 44, lineHeight: 1, color: '#7c3aed', fontStyle: 'italic' }}
              >
                {waitlistCount.toLocaleString('fr-FR')}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-inter)',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.12em',
                  color: '#6b6760',
                  marginTop: 8,
                }}
              >
                {waitlistCount > 1 ? 'déjà inscrits' : 'déjà inscrit'}
              </div>
            </div>

            <div
              aria-hidden="true"
              style={{ width: 1, height: 48, background: 'rgba(0,0,0,.1)', flexShrink: 0 }}
            />
          </>
        )}

        <div style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: 44, lineHeight: 1, color: '#7c3aed', fontStyle: 'italic' }}
          >
            100
          </div>
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#6b6760',
              marginTop: 8,
            }}
          >
            SPF couverts
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{ width: 1, height: 48, background: 'rgba(0,0,0,.1)', flexShrink: 0 }}
        />

        <div style={{ textAlign: 'center' }}>
          <div
            style={{ fontSize: 44, lineHeight: 1, color: '#7c3aed', fontStyle: 'italic' }}
          >
            1956
          </div>
          <div
            style={{
              fontFamily: 'var(--font-inter)',
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.12em',
              color: '#6b6760',
              marginTop: 8,
            }}
          >
            depuis cette année
          </div>
        </div>
      </div>
    </section>
  )
}
