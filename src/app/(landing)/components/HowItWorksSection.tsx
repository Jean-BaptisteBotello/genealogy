import { MiniTree } from './visuals/MiniTree'
import { FormFillBars } from './visuals/FormFillBars'
import { EnvelopeSent } from './visuals/EnvelopeSent'

const steps = [
  {
    num: 'i.',
    Visual: MiniTree,
    h3: 'Construisez ou importez votre arbre.',
    body: 'Ajoutez vos parents, grands-parents, ancêtres directs ou cousins. Un arbre minimal suffit pour commencer une recherche.',
    tag: 'Étape 1 · Votre famille',
  },
  {
    num: 'ii.',
    Visual: FormFillBars,
    h3: 'Choisissez qui chercher. On remplit le formulaire.',
    body: 'Sélectionnez un ancêtre dans votre arbre. Genealogy reprend automatiquement les noms, dates et lieux dans le bon Cerfa, dans les bons formats.',
    tag: 'Étape 2 · Pré-remplissage',
  },
  {
    num: 'iii.',
    Visual: EnvelopeSent,
    h3: 'Envoyez au bon SPF, en un clic.',
    body: 'Genealogy identifie automatiquement le Service de Publicité Foncière compétent selon la commune, et transmet votre demande.',
    tag: 'Étape 3 · Envoi',
  },
]

export function HowItWorksSection() {
  return (
    <section
      id="comment-ca-marche"
      className="relative overflow-hidden rounded-[14px]"
      style={{
        background: '#f4f1ea',
        boxShadow: '0 30px 80px -30px rgba(0,0,0,0.18)',
        backgroundImage: 'radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px)',
        backgroundSize: '22px 22px',
        padding: '80px 56px 88px',
      }}
    >
      {/* Section head — 2-column: title left, lede right */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 56,
          alignItems: 'end',
          marginBottom: 64,
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
            La solution
          </div>

          <h2
            style={{
              fontFamily: 'var(--font-instrument-serif)',
              fontSize: 64,
              lineHeight: 0.96,
              letterSpacing: '-0.02em',
              color: '#1a1815',
              fontWeight: 400,
              margin: 0,
            }}
          >
            Trois étapes,
            <br />
            aucune <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>recopie</em>,
            <br />
            un seul envoi.
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
          Genealogy connecte votre arbre familial aux formulaires officiels du Service de
          Publicité Foncière. Vous choisissez qui chercher — on s&apos;occupe du reste.
        </p>
      </div>

      {/* Step cards — 3-column grid */}
      <div
        style={{
          position: 'relative',
          zIndex: 2,
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 24,
        }}
      >
        {steps.map(({ num, Visual, h3, body, tag }) => (
          <div
            key={num}
            style={{
              background: '#fff',
              borderRadius: 12,
              padding: '28px 26px 30px',
              border: '1px solid rgba(0,0,0,0.06)',
              boxShadow: '0 16px 40px -22px rgba(0,0,0,0.18)',
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
                fontFamily: 'var(--font-instrument-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: '#7c3aed',
              }}
            >
              {num}
            </div>

            {/* Visual */}
            <Visual />

            {/* H3 */}
            <h3
              style={{
                fontFamily: 'var(--font-instrument-serif)',
                fontWeight: 400,
                fontSize: 24,
                lineHeight: 1.1,
                letterSpacing: '-0.01em',
                color: '#1a1815',
                margin: 0,
              }}
            >
              {h3}
            </h3>

            {/* Body */}
            <p
              style={{
                fontSize: 13,
                lineHeight: 1.55,
                color: '#4a4641',
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

      {/* Footnote */}
      <p
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 56,
          textAlign: 'center',
          fontFamily: 'var(--font-instrument-serif)',
          fontStyle: 'italic',
          fontSize: 22,
          color: '#4a4641',
          marginBottom: 0,
        }}
      >
        Et vous récupérez la réponse{' '}
        <em style={{ fontStyle: 'italic', color: '#7c3aed' }}>
          directement dans votre boîte mail
        </em>
        .
      </p>
    </section>
  )
}
