'use client'

import Link from 'next/link'
import { useEffect, useState, type FormEvent } from 'react'
import { submitWaitlist } from '../lib/waitlist-action'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const STORAGE_KEY = 'waitlist_submitted'
const SUCCESS_EVENT = 'waitlist:success'

const ERROR_MESSAGES: Record<string, string> = {
  empty_email: 'Veuillez indiquer votre adresse email.',
  invalid_email: 'Cette adresse email ne semble pas valide.',
  server_error: 'Une erreur est survenue, réessayez.',
}

export function WaitlistForm({
  source = 'hero',
  isAuthenticated = false,
}: {
  source?: 'hero' | 'cta'
  isAuthenticated?: boolean
}) {
  const [state, setState] = useState<FormState>('idle')
  const [email, setEmail] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [isHover, setIsHover] = useState(false)

  // Cross-instance + session-persistent success (localStorage + storage event +
  // same-tab custom event so both forms flip to success without page reload).
  useEffect(() => {
    if (isAuthenticated) return
    try {
      if (localStorage.getItem(STORAGE_KEY) === '1') {
        setState('success')
      }
    } catch {}
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue === '1') setState('success')
    }
    const onLocal = () => setState('success')
    window.addEventListener('storage', onStorage)
    window.addEventListener(SUCCESS_EVENT, onLocal)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(SUCCESS_EVENT, onLocal)
    }
  }, [isAuthenticated])

  // Authenticated users never see the waitlist form — they get a direct path
  // back to their tree, preserving the "where am I, where am I going" thread.
  if (isAuthenticated) {
    return (
      <div
        className="flex items-center justify-between gap-3 rounded-full px-5 py-3"
        style={{
          background: '#fff',
          border: '1px solid rgba(0,0,0,0.08)',
          boxShadow: '0 4px 14px -8px rgba(0,0,0,0.15)',
          maxWidth: source === 'cta' ? 480 : 440,
        }}
      >
        <span className="text-sm" style={{ color: '#1a1815' }}>
          Vous êtes connecté·e.
        </span>
        <Link
          href="/tree"
          className="rounded-full px-4 py-2 text-xs font-medium transition-colors"
          style={{
            background: '#1a1815',
            color: '#f4f1ea',
            fontFamily: 'var(--font-inter)',
          }}
        >
          Accéder à mon arbre →
        </Link>
      </div>
    )
  }

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
      try {
        localStorage.setItem(STORAGE_KEY, '1')
      } catch {}
      window.dispatchEvent(new Event(SUCCESS_EVENT))
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
