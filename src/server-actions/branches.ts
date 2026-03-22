'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRole } from '@/lib/auth/role-guard'

export async function createBranch(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role = await getCurrentRole(supabase, user.id)
  if (role === 'VIEWER') return { error: 'Permission refusée.' }

  const { data, error } = await supabase
    .from('branch')
    .insert({
      nom: formData.get('nom') as string,
      couleur: formData.get('couleur') as string,
      description: (formData.get('description') as string) || null,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function updateBranch(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role = await getCurrentRole(supabase, user.id)
  if (role === 'VIEWER') return { error: 'Permission refusée.' }

  const id = formData.get('id') as string

  const { data, error } = await supabase
    .from('branch')
    .update({
      nom: formData.get('nom') as string,
      couleur: formData.get('couleur') as string,
      description: (formData.get('description') as string) || null,
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deleteBranch(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role = await getCurrentRole(supabase, user.id)
  if (role !== 'ADMIN') return { error: 'Permission refusée.' }

  const { error } = await supabase.from('branch').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function assignPersonToBranch(
  personId: string,
  branchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role = await getCurrentRole(supabase, user.id)
  if (role === 'VIEWER') return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('person_branch')
    .insert({ person_id: personId, branch_id: branchId })
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function removePersonFromBranch(
  personId: string,
  branchId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role = await getCurrentRole(supabase, user.id)
  if (role !== 'ADMIN') return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('person_branch')
    .delete()
    .eq('person_id', personId)
    .eq('branch_id', branchId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
