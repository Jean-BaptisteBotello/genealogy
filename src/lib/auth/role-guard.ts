// src/lib/auth/role-guard.ts
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Role } from '@/lib/types/database'

/**
 * Fetches the current user's role from tree_member.
 * Returns 'ADMIN' if no members exist (founder), 'VIEWER' if unknown user, or the stored role.
 */
export async function getCurrentRole(
  supabase: SupabaseClient,
  userId: string
): Promise<Role> {
  const [{ data: memberRow }, { count }] = await Promise.all([
    supabase.from('tree_member').select('role').eq('user_id', userId).single(),
    supabase.from('tree_member').select('*', { count: 'exact', head: true }),
  ])

  if (memberRow?.role) return memberRow.role as Role
  return count === 0 ? 'ADMIN' : 'VIEWER'
}
