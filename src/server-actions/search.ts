'use server'
import { createClient } from '@/lib/supabase/server'
import type { Person } from '@/lib/types/database'

export async function searchPersons(query: string): Promise<Person[]> {
  if (!query.trim()) return []
  const supabase = await createClient()
  const term = `%${query.trim()}%`
  const { data } = await supabase
    .from('person')
    .select('*')
    .or(
      `prenom.ilike.${term},nom.ilike.${term},lieu_naissance.ilike.${term},lieu_deces.ilike.${term}`
    )
    .limit(10)
  return data ?? []
}
