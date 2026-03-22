import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockSignInWithPassword = vi.fn()
const mockSignUp = vi.fn()
const mockSignOut = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: mockSignInWithPassword,
      signUp: mockSignUp,
      signOut: mockSignOut,
    },
  })),
}))

vi.mock('next/navigation', () => ({ redirect: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

describe('auth server actions', () => {
  beforeEach(() => { vi.clearAllMocks() })

  it('login calls signInWithPassword with correct credentials', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: null })
    const { login } = await import('../auth')
    const form = new FormData()
    form.set('email', 'test@example.com')
    form.set('password', 'password123')
    await login(form)
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    })
  })

  it('login returns error message on failure', async () => {
    mockSignInWithPassword.mockResolvedValue({ error: { message: 'Invalid credentials' } })
    const { login } = await import('../auth')
    const form = new FormData()
    form.set('email', 'bad@example.com')
    form.set('password', 'wrong')
    const result = await login(form)
    expect(result).toEqual({ error: 'Invalid credentials' })
  })
})
