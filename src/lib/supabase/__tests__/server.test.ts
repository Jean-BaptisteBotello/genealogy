import { describe, it, expect, vi } from 'vitest'

vi.mock('@supabase/ssr', () => ({
  createServerClient: vi.fn(() => ({ auth: {}, from: vi.fn() })),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({ getAll: () => [], set: vi.fn() })),
}))

describe('createClient (server)', () => {
  it('creates a server Supabase client', async () => {
    const { createClient } = await import('../server')
    const client = await createClient()
    expect(client).toBeDefined()
    expect(client.auth).toBeDefined()
  })
})
