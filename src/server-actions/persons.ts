// src/server-actions/persons.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { geocodeLieu } from '@/lib/geocode'

export async function createPerson(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const lieu_naissance = (formData.get('lieu_naissance') as string) || null
  const lieu_deces = (formData.get('lieu_deces') as string) || null

  const [geoNaissance, geoDeces] = await Promise.all([
    lieu_naissance ? geocodeLieu(lieu_naissance) : null,
    lieu_deces ? geocodeLieu(lieu_deces) : null,
  ])

  const { data, error } = await supabase
    .from('person')
    .insert({
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      date_naissance: (formData.get('date_naissance') as string) || null,
      lieu_naissance,
      lat_naissance: geoNaissance?.lat ?? null,
      lon_naissance: geoNaissance?.lon ?? null,
      date_deces: (formData.get('date_deces') as string) || null,
      lieu_deces,
      lat_deces: geoDeces?.lat ?? null,
      lon_deces: geoDeces?.lon ?? null,
      notes: (formData.get('notes') as string) || null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function updatePerson(
  formData: FormData
): Promise<{ error?: string; id?: string }> {
  const supabase = await createClient()
  const id = formData.get('id') as string
  const lieu_naissance = (formData.get('lieu_naissance') as string) || null
  const lieu_deces = (formData.get('lieu_deces') as string) || null

  const [geoNaissance, geoDeces] = await Promise.all([
    lieu_naissance ? geocodeLieu(lieu_naissance) : null,
    lieu_deces ? geocodeLieu(lieu_deces) : null,
  ])

  const { data, error } = await supabase
    .from('person')
    .update({
      prenom: formData.get('prenom') as string,
      nom: formData.get('nom') as string,
      date_naissance: (formData.get('date_naissance') as string) || null,
      lieu_naissance,
      lat_naissance: geoNaissance?.lat ?? null,
      lon_naissance: geoNaissance?.lon ?? null,
      date_deces: (formData.get('date_deces') as string) || null,
      lieu_deces,
      lat_deces: geoDeces?.lat ?? null,
      lon_deces: geoDeces?.lon ?? null,
      notes: (formData.get('notes') as string) || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return { id: data.id }
}

export async function deletePerson(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from('person').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
