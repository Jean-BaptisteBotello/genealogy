import { PagesStack } from './visuals/PagesStack'
import { SpfMap } from './visuals/SpfMap'
import { CalendarWait } from './visuals/CalendarWait'

// ─── Design tokens ────────────────────────────────────────────────────────────
const cream = '#f4f1ea'
const cardBg = '#fff'
const ink = '#1a1815'
const inkSoft = '#4a4641'
const violet = '#7c3aed'

// ─── Pain card data ───────────────────────────────────────────────────────────
const pains = [
  {
    num: 'i.',
    Visual: PagesStack,
    title: 'Des dizaines de champs identiques, à recopier à la main.',
    body: 'Le même nom, la même adresse, les mêmes dates répétés sur chaque ligne — et à chaque demande. Une seule faute de frappe, et tout est à refaire.',
    tag: 'Cerfa 3233 / 3236',
  },
  {
    num: 'ii.',
    Visual: SpfMap,
    title: 'Trouver le bon service parmi 100 SPF en France.',
    body: 'Chaque commune dépend d'un Service de Publicité Foncière différent. Se tromper d'adresse, c'est 6 semaines de perdues — quand on a même une réponse.',
    tag: '100 services en France',
  },
  {
    num: 'iii.',
    Visual: CalendarWait,
    title: 'Trouver le bon canal d'envoi, et attendre sans suivi.',
    body: 'Messagerie sécurisée impots.gouv, courriel direct au SPF, courrier en deux exemplaires… selon le cas. Pas d'accusé de réception, pas de suivi\u00a0: la réponse arrive en quelques jours — ou plusieurs semaines.',
    tag: '10 jours en théorie · variable en pratique',
  },
]

// ─── Component ────────────────────────────────────────────────────────────────
export function ProblemSection() {
  return (
    <section
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
            Le problème
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
            Une démarche
            <br />
            <em style={{ fontStyle: 'italic', color: violet }}>épuisante</em>,
            <br />
            conçue pour 1980.
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
          Aujourd&rsquo;hui, se renseigner auprès des services des impôts pour des recherches
          familiales n&rsquo;a rien d&rsquo;évident — alors même qu&rsquo;ils proposent ce service,
          via deux formulaires obscurs. La plupart des familles n&rsquo;essayent jamais.
        </p>
      </div>

      {/* ── Pain cards grid ──────────────────────────────────────── */}
      <div
        className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6"
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        {pains.map(({ num, Visual, title, body, tag }) => (
          <div
            key={num}
            style={{
              background: cardBg,
              borderRadius: 12,
              padding: '28px 26px 30px',
              border: '1px solid rgba(0,0,0,.06)',
              boxShadow: '0 16px 40px -22px rgba(0,0,0,.18)',
              display: 'flex',
              flexDirection: 'column',
              gap: 22,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Roman numeral */}
            <div
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontSize: 14,
                color: violet,
                fontStyle: 'italic',
              }}
            >
              {num}
            </div>

            {/* Visual */}
            <Visual />

            {/* Title */}
            <h3
              style={{
                fontFamily: "'Instrument Serif', serif",
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.1,
                margin: 0,
                color: ink,
                letterSpacing: '-0.01em',
              }}
            >
              {title}
            </h3>

            {/* Body */}
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: inkSoft,
                margin: 0,
              }}
            >
              {body}
            </p>

            {/* Tag */}
            <div
              style={{
                marginTop: 'auto',
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#8a8680',
                paddingTop: 14,
                borderTop: '1px solid #ece9e2',
              }}
            >
              {tag}
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
        Et c&rsquo;est exactement pour ça que{' '}
        <em style={{ color: violet, fontStyle: 'italic' }}>presque personne ne le fait</em>.
      </p>
    </section>
  )
}
