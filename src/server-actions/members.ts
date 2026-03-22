// src/server-actions/members.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/types/database'
import { getCurrentRole } from '@/lib/auth/role-guard'

export interface MemberWithUser {
  user_id: string
  role: Role
  invited_at: string
  invited_by: string
  users: { email: string; display_name: string } | null
}

export async function getMembers(): Promise<MemberWithUser[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tree_member')
    .select('*, users(email, display_name)')
  if (error || !data) return []
  return data as MemberWithUser[]
}

export async function inviteMember(
  email: string,
  role: Role
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role_check = await getCurrentRole(supabase, user.id)
  if (role_check !== 'ADMIN') return { error: 'Permission refusée.' }

  const admin = createAdminClient()
  const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { role } }
  )
  if (inviteError) return { error: inviteError.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function updateMemberRole(
  userId: string,
  role: Role
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role_check = await getCurrentRole(supabase, user.id)
  if (role_check !== 'ADMIN') return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('tree_member')
    .update({ role })
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}

export async function removeMember(
  userId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Non authentifié.' }

  const role_check = await getCurrentRole(supabase, user.id)
  if (role_check !== 'ADMIN') return { error: 'Permission refusée.' }

  const { error } = await supabase
    .from('tree_member')
    .delete()
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
