'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { randomUUID } from 'crypto'

const MAX_SIZE_BYTES = 20 * 1024 * 1024 // 20 MB
const SIGNED_URL_EXPIRY = 7 * 24 * 60 * 60 // 7 days in seconds
const BUCKET = 'documents'

export async function uploadDocument(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const file = formData.get('file') as File | null
  if (!file) return { error: 'Aucun fichier fourni.' }

  if (file.type !== 'application/pdf') {
    return { error: 'Seuls les fichiers PDF sont acceptés.' }
  }
  if (file.size > MAX_SIZE_BYTES) {
    return { error: 'Le fichier dépasse la limite de 20 Mo.' }
  }

  const documentId = randomUUID()
  const storagePath = `${user.id}/${documentId}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: 'application/pdf' })

  if (uploadError) return { error: uploadError.message }

  const { data, error: dbError } = await supabase
    .from('document')
    .insert({
      id: documentId,
      person_id: formData.get('person_id') as string,
      nom: formData.get('nom') as string,
      type: formData.get('type') as string,
      url_stockage: storagePath,
      taille_bytes: file.size,
      uploaded_by: user.id,
    })
    .select('id')
    .single()

  if (dbError) {
    // Clean up orphaned storage file if DB insert fails
    await supabase.storage.from(BUCKET).remove([storagePath])
    return { error: dbError.message }
  }

  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteDocument(
  documentId: string,
  storagePath: string
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: storageError } = await supabase.storage
    .from(BUCKET)
    .remove([storagePath])

  if (storageError) return { error: storageError.message }

  const { error: dbError } = await supabase
    .from('document')
    .delete()
    .eq('id', documentId)

  if (dbError) return { error: dbError.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function getSignedUrl(
  storagePath: string
): Promise<{ error?: string; url?: string }> {
  const supabase = await createClient()

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_EXPIRY)

  if (error) return { error: error.message }
  return { url: data.signedUrl }
}
