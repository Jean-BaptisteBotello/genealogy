'use client'

import { useEffect, useRef, useState } from 'react'
import { examples } from '../data/typewriter-examples'

function useTypewriterCycle() {
  const [fields, setFields] = useState({ demandeur: '', personne: '', immeuble: '' })
  const [activeCaret, setActiveCaret] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)
  const cancelRef = useRef(false)

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const rmq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!mq.matches || rmq.matches) {
      setFields({
        demandeur: examples[0].demandeur,
        personne: examples[0].personne,
        immeuble: examples[0].immeuble,
      })
      return
    }
    setIsEnabled(true)
  }, [])

  useEffect(() => {
    if (!isEnabled) return
    cancelRef.current = false

    const wait = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

    const typeField = async (field: string, text: string) => {
      for (let i = 1; i <= text.length; i++) {
        if (cancelRef.current) return
        setActiveCaret(field)
        setFields((prev) => ({ ...prev, [field]: text.slice(0, i) }))
        await wait(28 + Math.random() * 30)
      }
      setActiveCaret(null)
    }

    const eraseField = async (field: string) => {
      setActiveCaret(field)
      let currentLength = 0
      await new Promise<void>((resolve) =>
        setFields((prev) => {
          currentLength = prev[field as keyof typeof prev].length
          resolve()
          return prev
        })
      )
      for (let i = currentLength - 1; i >= 0; i--) {
        if (cancelRef.current) return
        setFields((prev) => ({ ...prev, [field]: prev[field as keyof typeof prev].slice(0, i) }))
        await wait(14)
      }
      setActiveCaret(null)
    }

    async function loop() {
      let idx = 0
      while (!cancelRef.current) {
        const ex = examples[idx]
        await typeField('demandeur', ex.demandeur)
        await wait(180)
        await typeField('personne', ex.personne)
        await wait(180)
        await typeField('immeuble', ex.immeuble)
        await wait(3000)
        await eraseField('immeuble')
        await eraseField('personne')
        await eraseField('demandeur')
        await wait(250)
        idx = (idx + 1) % examples.length
      }
    }

    loop()
    return () => { cancelRef.current = true }
  }, [isEnabled])

  return { fields, activeCaret }
}

function Caret({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      style={{
        display: 'inline-block',
        width: 1,
        height: '0.95em',
        background: '#7c3aed',
        verticalAlign: -2,
        marginLeft: 1,
        opacity: active ? 1 : 0,
        animation: active ? 'blink 1s steps(1) infinite' : 'none',
      }}
    />
  )
}

export function HeroFormPreview() {
  const { fields, activeCaret } = useTypewriterCycle()

  return (
    <>
      <style>{`@keyframes blink { 0%,50%{opacity:1} 51%,100%{opacity:0} }`}</style>
      <div
        style={{
          background: '#fff',
          borderRadius: 10,
          padding: '22px 22px 26px',
          border: '1px solid rgba(0,0,0,0.07)',
          boxShadow: '0 30px 60px -30px rgba(0,0,0,0.18), 0 8px 24px -12px rgba(124,58,237,0.18)',
          transform: 'rotate(-1.4deg)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, paddingBottom: 14, borderBottom: '1px solid #ece9e2' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-instrument-serif)', fontSize: 22, color: '#1a1815' }}>Cerfa 3233</div>
            <div style={{ fontSize: 10, color: '#6b6760', textTransform: 'uppercase', letterSpacing: '0.12em', marginTop: 6 }}>Demande de renseignements</div>
          </div>
          <span style={{ background: '#ede9fe', color: '#7c3aed', fontSize: 10, padding: '4px 9px', borderRadius: 999, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Pré-rempli</span>
        </div>

        {/* Animated fields */}
        {[
          { label: 'Demandeur', key: 'demandeur' as const },
          { label: 'Personne recherchée', key: 'personne' as const },
          { label: 'Immeuble', key: 'immeuble' as const },
        ].map(({ label, key }) => (
          <div key={key} style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6760', marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: 13, color: '#7c3aed', fontWeight: 500, background: '#ede9fe', padding: '8px 12px', borderRadius: 5, border: '1px solid #ddd6fe', minHeight: '1.2em' }}>
              {fields[key]}<Caret active={activeCaret === key} />
            </div>
          </div>
        ))}

        {/* Static period field */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b6760', marginBottom: 4 }}>Période de délivrance</div>
          <div style={{ fontSize: 13, color: '#1a1815', background: '#faf8f4', padding: '8px 12px', borderRadius: 5, border: '1px solid #ece9e2' }}>depuis le 1er janvier 1956</div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid #ece9e2', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#7c3aed', fontSize: 11 }}>✓ Prêt à envoyer</span>
          <span style={{ background: '#1a1815', color: '#f4f1ea', fontSize: 11, padding: '6px 14px', borderRadius: 999, fontWeight: 500 }}>Envoyer au SPF</span>
        </div>
      </div>
    </>
  )
}
