'use client'

import { useState, type FormEvent } from 'react'
import { submitWaitlist } from '../lib/waitlist-action'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const ERROR_MESSAGES: Record<string, string> = {
  invalid_email: 'Cet email ne semble pas valide.',
  server_error: 'Une erreur est survenue, réessayez.',
}

export function WaitlistForm({ source = 'hero' }: { source?: 'hero' | 'cta' }) {
  const [state, setState] = useState<FormState>('idle')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setState('submitting')
    setErrorMsg('')

    const result = await submitWaitlist({ email, source })

    if (result.ok) {
      setState('success')
    } else {
      setState('error')
      setErrorMsg(ERROR_MESSAGES[result.error] || ERROR_MESSAGES.server_error)
    }
  }

  if (state === 'success') {
    return (
      <div
        className="flex items-center justify-center rounded-full px-6 py-3.5 text-sm font-medium"
        style={{
          background: '#e6dfcf',
          color: '#1a1815',
          maxWidth: source === 'cta' ? 480 : 440,
        }}
      >
        ✓ Merci, on vous écrit dès l'ouverture.
      </div>
    )
  }

  return (
    <div style={{ maxWidth: source === 'cta' ? 480 : 440 }}>
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 rounded-full border p-1.5"
        style={{
          background: '#fff',
          borderColor: 'rgba(0,0,0,0.08)',
          boxShadow: '0 4px 14px -8px rgba(0,0,0,0.15)',
        }}
      >
        <label htmlFor={`waitlist-email-${source}`} className="sr-only">
          Votre email
        </label>
        <input
          id={`waitlist-email-${source}`}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="vous@email.com"
          required
          className="flex-1 border-none bg-transparent px-4 py-3 text-sm outline-none"
          style={{ color: '#1a1815', fontFamily: 'var(--font-inter)' }}
        />
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="rounded-full px-5 py-3 text-sm font-medium"
          style={{
            background: '#1a1815',
            color: '#f4f1ea',
            fontFamily: 'var(--font-inter)',
            opacity: state === 'submitting' ? 0.7 : 1,
          }}
        >
          {state === 'submitting' ? 'Inscription…' : 'Rejoindre la waitlist'}
        </button>
      </form>
      {state === 'error' && (
        <p className="mt-2 text-xs" style={{ color: '#dc2626', paddingLeft: 18 }}>
          {errorMsg}
        </p>
      )}
    </div>
  )
}
