const faqs = [
  {
    marker: 'i.',
    question: (
      <>
        Est-ce que c&apos;est <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>légal</em> de
        demander ces informations&nbsp;?
      </>
    ),
    answer: (
      <>
        Oui. Les Cerfa 3233 et 3236 sont des formulaires officiels accessibles à{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>toute personne</strong>, sans
        justification de lien familial. Le Service de Publicité Foncière est un service public
        ouvert.
      </>
    ),
  },
  {
    marker: 'ii.',
    question: <>Combien ça coûte au total&nbsp;?</>,
    answer: (
      <>
        Le tarif officiel du SPF s&apos;applique :{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>12&nbsp;€ par recherche</strong>{' '}
        (formulaire 3233) et{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>6&nbsp;€ par bordereau</strong>{' '}
        (formulaire 3236). Genealogy ne prélève pas de commission sur ces tarifs administratifs ;
        le prix de l&apos;abonnement sera communiqué au lancement.
      </>
    ),
  },
  {
    marker: 'iii.',
    question: <>Et mes données familiales&nbsp;?</>,
    answer: (
      <>
        Vos données sont stockées en Europe, hébergées en Allemagne (Frankfurt), conformes{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>RGPD</strong>. Les documents PDF que
        vous générez sont accessibles via des liens signés à durée limitée. Vous gardez la
        propriété et le contrôle de vos contenus.
      </>
    ),
  },
  {
    marker: 'iv.',
    question: (
      <>
        Je n&apos;ai pas encore d&apos;arbre généalogique. Je peux quand même utiliser
        Genealogy&nbsp;?
      </>
    ),
    answer: (
      <>
        Oui. Vous pouvez créer un arbre minimal directement dans l&apos;app — il suffit
        d&apos;<strong style={{ color: '#1a1815', fontWeight: 500 }}>une seule personne</strong>{' '}
        pour lancer une recherche. Les liens familiaux peuvent être ajoutés au fur et à mesure que
        vous obtenez des informations.
      </>
    ),
  },
  {
    marker: 'v.',
    question: <>Que se passe-t-il après l&apos;envoi au SPF&nbsp;?</>,
    answer: (
      <>
        Le service de publicité foncière reçoit votre demande et vous répond directement, par
        courrier ou par courriel selon votre choix. Le délai légal est de{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>10 jours</strong> ; en pratique il
        oscille entre{' '}
        <strong style={{ color: '#1a1815', fontWeight: 500 }}>
          quelques jours et plusieurs semaines
        </strong>{' '}
        selon la charge du SPF concerné. Genealogy garde une trace de vos demandes pour vous
        éviter les doublons.
      </>
    ),
  },
  {
    marker: 'vi.',
    question: <>Quand est prévu le lancement&nbsp;?</>,
    answer: (
      <>
        Genealogy est en développement actif. Les inscrits à la waitlist seront prévenus en
        avant-première — et invités à tester l&apos;outil avant tout le monde.
      </>
    ),
  },
]

export function FaqSection() {
  return (
    <section
      id="faq"
      className="relative overflow-hidden rounded-[14px] px-6 py-12 md:px-14 md:py-20 md:pb-[88px]"
      style={{
        background: '#f4f1ea',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.18)',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
      }}
    >
      {/* Section head — 2-column: title left, lede right */}
      <div
        className="grid grid-cols-1 gap-8 mb-10 md:grid-cols-2 md:gap-14 md:mb-16"
        style={{
          position: 'relative',
          zIndex: 2,
          alignItems: 'end',
        }}
      >
        {/* Left — eyebrow + H2 */}
        <div>
          <div
            className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-[11px] uppercase"
            style={{
              letterSpacing: '0.16em',
              color: '#4a4641',
              background: 'rgba(255,255,255,0.55)',
              borderColor: 'rgba(0,0,0,0.06)',
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: '#7c3aed' }} />
            Questions fréquentes
          </div>

          <h2
            className="landing-h2"
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              lineHeight: 0.96,
              letterSpacing: '-0.02em',
              color: '#1a1815',
              fontWeight: 400,
              margin: 0,
            }}
          >
            Tout ce que vous
            <br />
            vous demandez
            <br />
            <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>avant d&apos;essayer</em>.
          </h2>
        </div>

        {/* Right — lede */}
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: '#4a4641',
            maxWidth: 440,
            margin: 0,
          }}
        >
          Quelques précisions sur la légalité, les coûts, vos données, et ce qui se passe après
          l&apos;envoi.
        </p>
      </div>

      {/* FAQ list — single column, max-width 820px centered */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          maxWidth: 820,
          margin: '0 auto',
        }}
      >
        {faqs.map(({ marker, question, answer }, idx) => (
          <details
            key={marker}
            className="landing-faq-item"
            style={{
              borderTop: '1px solid rgba(0,0,0,0.1)',
              borderBottom: idx === faqs.length - 1 ? '1px solid rgba(0,0,0,0.1)' : undefined,
              padding: '0',
            }}
          >
            <summary
              style={{
                listStyle: 'none',
                cursor: 'pointer',
                padding: '24px 0',
                display: 'grid',
                gridTemplateColumns: '1fr auto auto',
                gap: 20,
                alignItems: 'center',
              }}
            >
              <h3
                className="landing-faq-q"
                style={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontSize: 26,
                  lineHeight: 1.15,
                  color: '#1a1815',
                  fontWeight: 400,
                  letterSpacing: '-0.01em',
                  margin: 0,
                }}
              >
                {question}
              </h3>
              <span
                className="landing-faq-marker"
                style={{
                  fontFamily: 'var(--font-instrument-serif)',
                  fontStyle: 'italic',
                  color: '#7c3aed',
                  fontSize: 14,
                }}
              >
                {marker}
              </span>
              <span
                aria-hidden="true"
                className="landing-faq-chevron"
                style={{
                  display: 'inline-flex',
                  width: 28,
                  height: 28,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 999,
                  border: '1px solid rgba(0,0,0,0.1)',
                  color: '#4a4641',
                  transition: 'transform 200ms ease, background 200ms ease',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                +
              </span>
            </summary>
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.6,
                color: '#4a4641',
                margin: 0,
                padding: '0 0 24px',
                maxWidth: 640,
              }}
            >
              {answer}
            </p>
          </details>
        ))}
      </div>

      {/* Footnote */}
      <p
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 56,
          marginBottom: 0,
          textAlign: 'center',
          fontFamily: 'var(--font-instrument-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          color: '#4a4641',
        }}
      >
        Une autre question ?{' '}
        <a
          href="mailto:contact@genealogy.fr"
          style={{
            color: '#7c3aed',
            textDecoration: 'underline',
            textDecorationThickness: 1,
            textUnderlineOffset: 4,
            fontStyle: 'italic',
          }}
        >
          Écrivez-nous
        </a>
        .
      </p>

      {/* Sources strip */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 32,
          paddingTop: 20,
          borderTop: '1px dashed rgba(0,0,0,0.12)',
          textAlign: 'center',
          fontFamily: 'Inter, sans-serif',
          fontSize: 11,
          color: '#6b6760',
          letterSpacing: '0.02em',
          lineHeight: 1.6,
        }}
      >
        <span
          style={{
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            fontSize: 10,
            color: '#7c3aed',
            fontWeight: 600,
            marginRight: 8,
          }}
        >
          Sources officielles
        </span>
        <a
          href="https://www.service-public.gouv.fr/particuliers/vosdroits/F17759"
          target="_blank"
          rel="noopener"
          style={{
            color: '#4a4641',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(124,58,237,0.35)',
            textUnderlineOffset: 3,
          }}
        >
          service-public.gouv.fr — Comment obtenir des renseignements immobiliers ?
        </a>
        <span style={{ margin: '0 10px', color: '#c9c4b8' }}>·</span>
        <a
          href="https://www.impots.gouv.fr/formulaire/3236-sd/demande-de-copie-de-documents-pour-la-periode-compter-du-1er-janvier-1956"
          target="_blank"
          rel="noopener"
          style={{
            color: '#4a4641',
            textDecoration: 'underline',
            textDecorationColor: 'rgba(124,58,237,0.35)',
            textUnderlineOffset: 3,
          }}
        >
          impots.gouv.fr — Cerfa 3236-SD
        </a>
      </div>
    </section>
  )
}
