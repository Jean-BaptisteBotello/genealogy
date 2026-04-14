// ─── Design tokens ────────────────────────────────────────────────────────────
const cream = '#f4f1ea'
const ink = '#1a1815'
const inkSoft = '#4a4641'
const violet = '#7c3aed'
const violetSoft = '#ede9fe'

// ─── Form card data ───────────────────────────────────────────────────────────
const forms = [
  {
    ref: '3233',
    name: 'Demande de renseignements.',
    desc: "Le formulaire de recherche\u00a0: permet d\u2019identifier les biens immobiliers liés à une personne ou à un immeuble, à partir du 1er janvier 1956.",
    when: "Vous cherchez à savoir quels biens un ancêtre a possédés, ou qui est propriétaire d\u2019une parcelle.",
    chips: [
      'Personnes recherchées',
      "Désignation d\u2019immeubles",
      'Période de délivrance',
      'Coût et facturation',
      'Mode de paiement',
    ],
    pricePrefix: 'à partir de ',
    priceAmount: '12\u00a0€',
  },
  {
    ref: '3236',
    name: 'Copies de documents fonciers.',
    desc: "Le formulaire de récupération\u00a0: une fois les références d\u2019un acte connues, il permet d\u2019obtenir la copie du document d\u2019origine au SPF.",
    when: "Vous avez les références d\u2019un acte (volume, numéro) et souhaitez obtenir sa copie officielle.",
    chips: [
      'Nature du document',
      'Date de formalité',
      'N° SAGES\u00a0/ SPF',
      'Volume\u00a0& numéro',
      'Coût et facturation',
    ],
    pricePrefix: 'à partir de ',
    priceAmount: '6\u00a0€',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function FormsSection() {
  return (
    <section
      id="formulaires"
      className="px-6 py-12 md:px-14 md:py-20 md:pb-[88px]"
      style={{
        background: cream,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,.18)',
        position: 'relative',
      }}
    >
      {/* Dot texture overlay */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          pointerEvents: 'none',
          opacity: 0.55,
        }}
      />

      {/* ── Section head ─────────────────────────────────────────── */}
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
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 11,
              textTransform: 'uppercase',
              letterSpacing: '0.16em',
              color: inkSoft,
              background: 'rgba(255,255,255,.55)',
              padding: '7px 14px',
              borderRadius: 999,
              border: '1px solid rgba(0,0,0,.06)',
              marginBottom: 24,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: violet,
                display: 'inline-block',
                flexShrink: 0,
              }}
            />
            Les formulaires
          </div>

          <h2
            className="landing-h2"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              lineHeight: 0.96,
              letterSpacing: '-0.02em',
              margin: 0,
              color: ink,
            }}
          >
            Les deux Cerfa
            <br />
            officiels du{' '}
            <em style={{ fontStyle: 'italic', color: violet }}>SPF</em>,
            <br />
            digitalisés.
          </h2>
        </div>

        {/* Right — lede */}
        <p
          style={{
            fontSize: 16,
            lineHeight: 1.55,
            color: inkSoft,
            maxWidth: 440,
            margin: 0,
          }}
        >
          Genealogy reprend les deux formulaires utilisés par les Services de Publicité
          Foncière pour rechercher des biens et obtenir les copies des actes — sans en
          modifier la valeur juridique.
        </p>
      </div>

      {/* ── Form cards grid ──────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8"
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        {forms.map(({ ref, name, desc, when, chips, pricePrefix, priceAmount }) => (
          <div
            key={ref}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '36px 36px 32px',
              border: '1px solid rgba(0,0,0,.06)',
              boxShadow: '0 16px 40px -22px rgba(0,0,0,.18)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* Violet top border */}
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: 4,
                background: violet,
                opacity: 0.8,
              }}
            />

            {/* Card head — big number + badge */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 28,
                paddingBottom: 22,
                borderBottom: '1px solid #ece9e2',
              }}
            >
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontSize: 56,
                  lineHeight: 0.9,
                  color: ink,
                  fontWeight: 400,
                  letterSpacing: '-0.02em',
                }}
              >
                {ref}
                <span
                  style={{
                    display: 'block',
                    fontFamily: 'Inter, sans-serif',
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '0.14em',
                    color: '#6b6760',
                    marginTop: 10,
                    fontWeight: 500,
                    fontStyle: 'normal',
                  }}
                >
                  Cerfa SD
                </span>
              </div>

              <div
                style={{
                  background: violetSoft,
                  color: violet,
                  fontSize: 10,
                  padding: '5px 11px',
                  borderRadius: 999,
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  whiteSpace: 'nowrap',
                }}
              >
                Officiel
              </div>
            </div>

            {/* Form name */}
            <h3
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontStyle: 'italic',
                fontSize: 26,
                lineHeight: 1.15,
                color: ink,
                margin: '0 0 14px',
              }}
            >
              {name}
            </h3>

            {/* Description */}
            <p
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: inkSoft,
                margin: '0 0 24px',
              }}
            >
              {desc}
            </p>

            {/* When to use box */}
            <div
              style={{
                background: '#faf8f4',
                border: '1px solid #ece9e2',
                borderRadius: 8,
                padding: '14px 16px',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  fontSize: 9,
                  textTransform: 'uppercase',
                  letterSpacing: '0.14em',
                  color: violet,
                  fontWeight: 600,
                  marginBottom: 6,
                }}
              >
                À utiliser quand
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: ink,
                  lineHeight: 1.5,
                }}
              >
                {when}
              </div>
            </div>

            {/* Chips */}
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
                marginBottom: 24,
              }}
            >
              {chips.map((chip) => (
                <span
                  key={chip}
                  style={{
                    background: cream,
                    border: '1px solid #ece9e2',
                    color: inkSoft,
                    fontSize: 11,
                    padding: '5px 10px',
                    borderRadius: 999,
                  }}
                >
                  {chip}
                </span>
              ))}
            </div>

            {/* Footer — price + label */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: 20,
                borderTop: '1px solid #ece9e2',
                fontSize: 11,
                color: '#6b6760',
                marginTop: 'auto',
              }}
            >
              <div
                style={{
                  fontFamily: "'Instrument Serif', serif",
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: ink,
                }}
              >
                {pricePrefix}
                <strong
                  style={{
                    color: violet,
                    fontStyle: 'normal',
                    fontWeight: 500,
                  }}
                >
                  {priceAmount}
                </strong>
              </div>
              <div>Tarif officiel SPF</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footnote ─────────────────────────────────────────────── */}
      <p
        style={{
          marginTop: 56,
          marginBottom: 0,
          textAlign: 'center',
          fontFamily: "'Instrument Serif', serif",
          fontStyle: 'italic',
          fontSize: 22,
          color: inkSoft,
          position: 'relative',
          zIndex: 2,
        }}
      >
        100 services de publicité foncière couverts —{' '}
        <em style={{ fontStyle: 'italic', color: violet }}>l&apos;ensemble du territoire</em>.
      </p>
    </section>
  )
}
