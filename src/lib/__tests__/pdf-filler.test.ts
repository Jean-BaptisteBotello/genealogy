import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'
import { fill3233PDF, fill3236PDF } from '../pdf-filler'

// Mock fetch so that loadPDF() in the lib can read the real Cerfa PDFs from
// the public/ folder during tests (jsdom has no network).
beforeAll(() => {
  const originalFetch = globalThis.fetch
  vi.stubGlobal('fetch', async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input.toString()
    if (url.startsWith('/forms/')) {
      const filePath = resolve(process.cwd(), 'public', url.replace(/^\//, ''))
      const buffer = readFileSync(filePath)
      return new Response(
        // Ensure a proper ArrayBuffer (not SharedArrayBuffer)
        buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength),
        { status: 200, headers: { 'Content-Type': 'application/pdf' } }
      )
    }
    return originalFetch(input as RequestInfo)
  })
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('PDF filler', () => {
  it('fill3233PDF returns a non-empty Uint8Array', async () => {
    const result = await fill3233PDF({
      nom: 'DUPONT',
      prenoms: 'Jean Pierre Marcel',
      dateNaissance: '1860',
      lieuNaissance: 'Lyon (69)',
      dateDeces: null,
      lieuDeces: null,
      typeRecherche: 'personne',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(1000)
  })

  it('fill3233PDF handles immeuble search with commune/section/parcelle', async () => {
    const result = await fill3233PDF({
      nom: 'DUPONT',
      prenoms: 'Philippe',
      dateNaissance: null,
      lieuNaissance: null,
      dateDeces: null,
      lieuDeces: null,
      typeRecherche: 'immeuble',
      commune: 'Toulon',
      section: 'AB',
      parcelle: '123',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(1000)
  })

  it('fill3236PDF returns a non-empty Uint8Array', async () => {
    const result = await fill3236PDF({
      volume: '1234',
      numero: '56',
      spfName: 'SPF de Toulon',
    })
    expect(result).toBeInstanceOf(Uint8Array)
    expect(result.length).toBeGreaterThan(1000)
  })
})
