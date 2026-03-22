import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('geocodeLieu', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('returns lat/lon for a valid place name', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [{ lat: '48.8566', lon: '2.3522' }],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toEqual({ lat: 48.8566, lon: 2.3522 })
  })

  it('returns null when the API returns an empty array', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => [],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('XYZ_NONEXISTENT')
    expect(result).toBeNull()
  })

  it('returns null when the API responds with !ok', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => [],
    } as Response)

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toBeNull()
  })

  it('returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'))

    const { geocodeLieu } = await import('./geocode')
    const result = await geocodeLieu('Paris')
    expect(result).toBeNull()
  })
})
