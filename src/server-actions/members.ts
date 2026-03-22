// src/server-actions/members.ts
'use server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { Role } from '@/lib/types/database'

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

  const admin = createAdminClient()
  const { data: inviteData, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    email,
    { data: { role } }
  )
  if (inviteError || !inviteData.user) return { error: inviteError?.message ?? 'Erreur invitation.' }

  const newUserId = inviteData.user.id

  // Upsert the user in the public users table
  await supabase.from('users').upsert({
    id: newUserId,
    email,
    display_name: email.split('@')[0],
  })

  // Create tree_member
  const { error: memberError } = await supabase.from('tree_member').insert({
    user_id: newUserId,
    role,
    invited_by: user.id,
  })
  if (memberError) return { error: memberError.message }

  revalidatePath('/tree', 'layout')
  return {}
}

export async function updateMemberRole(
  userId: string,
  role: Role
): Promise<{ error?: string }> {
  const supabase = await createClient()
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
  const { error } = await supabase
    .from('tree_member')
    .delete()
    .eq('user_id', userId)
  if (error) return { error: error.message }
  revalidatePath('/tree', 'layout')
  return {}
}
