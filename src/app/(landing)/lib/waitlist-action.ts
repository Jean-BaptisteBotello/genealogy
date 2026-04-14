'use server'

import { createClient } from '@/lib/supabase/server'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const VALID_SOURCES = ['hero', 'cta'] as const

type WaitlistResult = { ok: true } | { ok: false; error: 'invalid_email' | 'server_error' }

export async function submitWaitlist({
  email,
  source,
}: {
  email: string
  source: string
}): Promise<WaitlistResult> {
  const normalized = email.trim().toLowerCase()

  if (!EMAIL_REGEX.test(normalized)) {
    return { ok: false, error: 'invalid_email' }
  }

  const validSource = (VALID_SOURCES as readonly string[]).includes(source) ? source : 'hero'

  try {
    const supabase = await createClient()
    const { error } = await supabase
      .from('waitlist_signups')
      .insert({ email: normalized, source: validSource })
    if (error) {
      // 23505 = unique_violation → déjà inscrit, on traite comme un succès silencieux
      if (error.code === '23505') {
        return { ok: true }
      }
      console.error('[waitlist] supabase error:', error)
      return { ok: false, error: 'server_error' }
    }
    return { ok: true }
  } catch (err) {
    console.error('[waitlist] unexpected error:', err)
    return { ok: false, error: 'server_error' }
  }
}
