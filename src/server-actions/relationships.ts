// src/server-actions/relationships.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { hasAncestorCycle } from '@/lib/cycle-detection'

const CYCLE_CHECKED_TYPES = new Set(['PARENT_CHILD', 'ADOPTION'])

export async function createRelationship(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const person_a_id = formData.get('person_a_id') as string
  const person_b_id = formData.get('person_b_id') as string
  const type = formData.get('type') as string
  const metadataRaw = formData.get('metadata') as string | null

  const metadata = metadataRaw ? JSON.parse(metadataRaw) : {}

  // Cycle check for hierarchical types.
  // Convention: person_a_id = proposed parent, person_b_id = child.
  if (CYCLE_CHECKED_TYPES.has(type)) {
    const { data: existingRels } = await supabase
      .from('relationship')
      .select('*')

    const rels = (existingRels ?? []) as {
      person_a_id: string
      person_b_id: string
      type: string
    }[]

    if (hasAncestorCycle(person_b_id, person_a_id, rels)) {
      return {
        error: "Cette relation créerait un cycle dans l'arbre généalogique.",
      }
    }
  }

  const { data, error } = await supabase
    .from('relationship')
    .insert({ person_a_id, person_b_id, type, metadata })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteRelationship(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('relationship').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
