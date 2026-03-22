// src/server-actions/__tests__/documents.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/lib/supabase/server', () => ({ createClient: vi.fn() }))
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }))

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Storage mock
const mockStorageUpload = vi.fn()
const mockStorageRemove = vi.fn()
const mockStorageCreateSignedUrl = vi.fn()
const mockStorageFrom = vi.fn(() => ({
  upload: mockStorageUpload,
  remove: mockStorageRemove,
  createSignedUrl: mockStorageCreateSignedUrl,
}))

// DB mock
const mockSingle = vi.fn()
const mockInsert = vi.fn(() => ({ select: () => ({ single: mockSingle }) }))
const mockDeleteEq = vi.fn(() => ({ error: null }))
const mockDelete = vi.fn(() => ({ eq: mockDeleteEq }))
const mockFrom = vi.fn(() => ({ insert: mockInsert, delete: mockDelete }))

const mockGetUser = vi.fn().mockResolvedValue({ data: { user: { id: 'user-1' } } })
const mockSupabase = {
  from: mockFrom,
  storage: { from: mockStorageFrom },
  auth: { getUser: mockGetUser },
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(createClient).mockResolvedValue(mockSupabase as any)
})

describe('uploadDocument', () => {
  function makeFile(name: string, type: string, size: number): File {
    const content = new Uint8Array(size)
    return new File([content], name, { type })
  }

  it('uploads a PDF and inserts metadata, returns document id', async () => {
    const file = makeFile('acte.pdf', 'application/pdf', 1024)
    mockStorageUpload.mockResolvedValue({ data: { path: 'user-1/doc-id.pdf' }, error: null })
    mockSingle.mockResolvedValue({ data: { id: 'doc-1' }, error: null })

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte de naissance')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ id: 'doc-1' })
    expect(mockStorageUpload).toHaveBeenCalled()
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        person_id: 'person-1',
        nom: 'Acte de naissance',
        type: 'ACTE_NAISSANCE',
        taille_bytes: 1024,
        uploaded_by: 'user-1',
      })
    )
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when file is not a PDF', async () => {
    const file = makeFile('photo.jpg', 'image/jpeg', 1024)

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Photo')
    form.set('type', 'AUTRE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Seuls les fichiers PDF sont acceptés.' })
    expect(mockStorageUpload).not.toHaveBeenCalled()
  })

  it('returns error when file exceeds 20 MB', async () => {
    const file = makeFile('big.pdf', 'application/pdf', 20971521)

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Gros fichier')
    form.set('type', 'AUTRE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Le fichier dépasse la limite de 20 Mo.' })
  })

  it('returns error when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } })

    const file = makeFile('acte.pdf', 'application/pdf', 512)
    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Non authentifié.' })
  })

  it('returns error when storage upload fails', async () => {
    const file = makeFile('acte.pdf', 'application/pdf', 1024)
    mockStorageUpload.mockResolvedValue({ data: null, error: { message: 'Storage full' } })

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'Storage full' })
  })

  it('cleans up storage when DB insert fails', async () => {
    const file = makeFile('acte.pdf', 'application/pdf', 1024)
    mockStorageUpload.mockResolvedValue({ data: { path: 'user-1/doc-id.pdf' }, error: null })
    mockSingle.mockResolvedValue({ data: null, error: { message: 'DB error' } })

    const { uploadDocument } = await import('../documents')
    const form = new FormData()
    form.set('person_id', 'person-1')
    form.set('nom', 'Acte')
    form.set('type', 'ACTE_NAISSANCE')
    form.set('file', file)

    const result = await uploadDocument(form)
    expect(result).toEqual({ error: 'DB error' })
    expect(mockStorageRemove).toHaveBeenCalled()
  })
})

describe('deleteDocument', () => {
  it('removes from storage and deletes DB row', async () => {
    mockStorageRemove.mockResolvedValue({ error: null })
    mockDeleteEq.mockReturnValueOnce({ error: null })

    const { deleteDocument } = await import('../documents')
    const result = await deleteDocument('doc-1', 'user-1/doc-1.pdf')
    expect(result).toEqual({})
    expect(mockStorageRemove).toHaveBeenCalledWith(['user-1/doc-1.pdf'])
    expect(revalidatePath).toHaveBeenCalledWith('/tree', 'layout')
  })

  it('returns error when storage remove fails', async () => {
    mockStorageRemove.mockResolvedValue({ error: { message: 'Not found' } })

    const { deleteDocument } = await import('../documents')
    const result = await deleteDocument('doc-1', 'user-1/doc-1.pdf')
    expect(result).toEqual({ error: 'Not found' })
  })

  it('returns error when DB delete fails', async () => {
    mockDeleteEq.mockReturnValueOnce({ error: { message: 'Constraint error' } } as any)

    const { deleteDocument } = await import('../documents')
    const result = await deleteDocument('doc-1', 'user-1/doc-1.pdf')
    expect(result).toEqual({ error: 'Constraint error' })
    expect(mockStorageRemove).not.toHaveBeenCalled()
  })
})

describe('getSignedUrl', () => {
  it('returns a signed URL for a storage path', async () => {
    mockStorageCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    })

    const { getSignedUrl } = await import('../documents')
    const result = await getSignedUrl('user-1/doc-1.pdf')
    expect(result).toEqual({ url: 'https://example.com/signed-url' })
    // 7 days = 604800 seconds
    expect(mockStorageCreateSignedUrl).toHaveBeenCalledWith('user-1/doc-1.pdf', 604800)
  })

  it('returns error when createSignedUrl fails', async () => {
    mockStorageCreateSignedUrl.mockResolvedValue({
      data: null,
      error: { message: 'Access denied' },
    })

    const { getSignedUrl } = await import('../documents')
    const result = await getSignedUrl('user-1/doc-1.pdf')
    expect(result).toEqual({ error: 'Access denied' })
  })
})
