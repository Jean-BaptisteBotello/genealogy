'use client'

import { useState, type FormEvent } from 'react'
import { submitWaitlist } from '../lib/waitlist-action'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const ERROR_MESSAGES: Record<string, string> = {
  empty_email: 'Veuillez indiquer votre adresse email.',
  invalid_email: 'Cette adresse email ne semble pas valide.',
  server_error: 'Une erreur est survenue, réessayez.',
}

export function WaitlistForm({ source = 'hero' }: { source?: 'hero' | 'cta' }) {
  const [state, setState] = useState<FormState>('idle')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isHover, setIsHover] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const trimmed = email.trim()
    if (trimmed.length === 0) {
      setState('error')
      setErrorMsg(ERROR_MESSAGES.empty_email)
      return
    }
    if (!EMAIL_REGEX.test(trimmed)) {
      setState('error')
      setErrorMsg(ERROR_MESSAGES.invalid_email)
      return
    }

    setState('submitting')
    setErrorMsg('')

    const result = await submitWaitlist({ email: trimmed, source })

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
        ✓ Merci, on vous écrit dès l&apos;ouverture.
      </div>
    )
  }

  const isSubmitting = state === 'submitting'
  const buttonBg = isSubmitting ? '#1a1815' : isHover ? '#7c3aed' : '#1a1815'

  return (
    <div style={{ maxWidth: source === 'cta' ? 480 : 440 }}>
      <form
        onSubmit={handleSubmit}
        noValidate
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
          onChange={(e) => {
            setEmail(e.target.value)
            if (state === 'error') {
              setState('idle')
              setErrorMsg('')
            }
          }}
          placeholder="vous@email.com"
          aria-invalid={state === 'error'}
          aria-describedby={state === 'error' ? `waitlist-error-${source}` : undefined}
          className="flex-1 border-none bg-transparent px-4 py-3 text-sm outline-none"
          style={{ color: '#1a1815', fontFamily: 'var(--font-inter)' }}
        />
        <button
          type="submit"
          disabled={isSubmitting}
          onMouseEnter={() => setIsHover(true)}
          onMouseLeave={() => setIsHover(false)}
          className="rounded-full px-5 py-3 text-sm font-medium"
          style={{
            background: buttonBg,
            color: '#f4f1ea',
            fontFamily: 'var(--font-inter)',
            opacity: isSubmitting ? 0.7 : 1,
            cursor: isSubmitting ? 'wait' : 'pointer',
            transition: 'background-color 160ms ease',
          }}
        >
          {isSubmitting ? 'Inscription…' : 'Rejoindre la waitlist'}
        </button>
      </form>
      {state === 'error' && (
        <p
          id={`waitlist-error-${source}`}
          role="alert"
          className="mt-2 text-xs"
          style={{ color: '#dc2626', paddingLeft: 18 }}
        >
          {errorMsg}
        </p>
      )}
    </div>
  )
}
