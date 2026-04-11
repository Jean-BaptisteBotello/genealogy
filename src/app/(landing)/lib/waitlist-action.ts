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
    await supabase
      .from('waitlist_signups')
      .upsert(
        { email: normalized, source: validSource },
        { onConflict: 'email', ignoreDuplicates: true }
      )
    return { ok: true }
  } catch {
    return { ok: false, error: 'server_error' }
  }
}
