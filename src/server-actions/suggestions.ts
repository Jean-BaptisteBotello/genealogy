// src/server-actions/suggestions.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCurrentRole } from '@/lib/auth/role-guard'
import { parsePayload } from '@/lib/validation/suggestions'
import type { EditPersonPayload, AddPersonPayload, AddRelationshipPayload } from '@/lib/validation/suggestions'
import { geocodeLieu } from '@/lib/geocode'
import type { SuggestionType, SuggestionWithProposer } from '@/lib/types/database'

export async function createSuggestion(
  type: SuggestionType,
  payload: Record<string, unknown>,
  targetId?: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  // Application-level anti-doublon pour ADD_PERSON (target_id null, pas de contrainte DB)
  if (type === 'ADD_PERSON') {
    const { data: existing } = await supabase
      .from('suggestion')
      .select('id')
      .eq('suggested_by', user.id)
      .eq('type', 'ADD_PERSON')
      .eq('status', 'PENDING')
      .single()
    if (existing) return { error: 'Vous avez déjà une proposition identique en attente.' }
  }

  const { error } = await supabase.from('suggestion').insert({
    type,
    payload,
    target_id: targetId ?? null,
    suggested_by: user.id,
  })
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function getSuggestionsPending(): Promise<SuggestionWithProposer[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('suggestion')
    .select('*, users(email, display_name)')
    .eq('status', 'PENDING')
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data as SuggestionWithProposer[]
}

export async function getMySuggestions(): Promise<SuggestionWithProposer[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []
  const { data, error } = await supabase
    .from('suggestion')
    .select('*, users(email, display_name)')
    .eq('suggested_by', user.id)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data as SuggestionWithProposer[]
}

export async function rejectSuggestion(
  id: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const role = await getCurrentRole(supabase, user.id)
  if (!['ADMIN', 'EDITOR'].includes(role)) return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('suggestion')
    .update({
      status: 'REJECTED',
      rejection_reason: reason,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function cancelSuggestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const { error } = await supabase
    .from('suggestion')
    .delete()
    .eq('id', id)
    .eq('suggested_by', user.id)
    .eq('status', 'PENDING')
  if (error) return { error: error.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function approveSuggestion(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }
  const role = await getCurrentRole(supabase, user.id)
  if (!['ADMIN', 'EDITOR'].includes(role)) return { error: 'Permission refusée.' }

  const { data: suggestion, error: loadError } = await supabase
    .from('suggestion')
    .select('*')
    .eq('id', id)
    .eq('status', 'PENDING')
    .single()
  if (loadError || !suggestion) return { error: 'Suggestion introuvable ou déjà traitée.' }

  const parsed = parsePayload(suggestion.type as SuggestionType, suggestion.payload)
  if (!parsed.ok) return { error: parsed.error }

  let applyError: string | undefined

  switch (suggestion.type as SuggestionType) {
    case 'EDIT_PERSON': {
      const data = parsed.data as EditPersonPayload
      const updates: Record<string, unknown> = { ...data }
      if ('lieu_naissance' in data) {
        const geo = data.lieu_naissance ? await geocodeLieu(data.lieu_naissance) : null
        updates.lat_naissance = geo?.lat ?? null
        updates.lon_naissance = geo?.lon ?? null
      }
      if ('lieu_deces' in data) {
        const geo = data.lieu_deces ? await geocodeLieu(data.lieu_deces) : null
        updates.lat_deces = geo?.lat ?? null
        updates.lon_deces = geo?.lon ?? null
      }
      const { error } = await supabase.from('person').update(updates).eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
    case 'ADD_PERSON': {
      const data = parsed.data as AddPersonPayload
      const [geoN, geoD] = await Promise.all([
        data.lieu_naissance ? geocodeLieu(data.lieu_naissance) : null,
        data.lieu_deces ? geocodeLieu(data.lieu_deces) : null,
      ])
      const { error } = await supabase.from('person').insert({
        ...data,
        lat_naissance: geoN?.lat ?? null,
        lon_naissance: geoN?.lon ?? null,
        lat_deces: geoD?.lat ?? null,
        lon_deces: geoD?.lon ?? null,
      })
      applyError = error?.message
      break
    }
    case 'DELETE_PERSON': {
      const { error } = await supabase.from('person').delete().eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
    case 'ADD_RELATIONSHIP': {
      const data = parsed.data as AddRelationshipPayload
      const { error } = await supabase.from('relationship').insert({
        person_a_id: data.person_a_id,
        person_b_id: data.person_b_id,
        type: data.type,
        metadata: data.metadata ?? {},
      })
      applyError = error?.message
      break
    }
    case 'DELETE_RELATIONSHIP': {
      const { error } = await supabase.from('relationship').delete().eq('id', suggestion.target_id)
      applyError = error?.message
      break
    }
  }

  if (applyError) return { error: applyError }

  const { error: updateError } = await supabase
    .from('suggestion')
    .update({ status: 'APPROVED', reviewed_by: user.id, reviewed_at: new Date().toISOString() })
    .eq('id', id)
  if (updateError) return { error: updateError.message }

  revalidatePath('/tree', 'layout')
  return {}
}
