// src/app/(app)/layout.tsx
// Server Component — no 'use client' directive
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { ThemeProvider } from '@/lib/context/theme-context'
import type { Person, Branch, Relationship, PersonBranch, Role } from '@/lib/types/database'
import type { MemberWithUser } from '@/server-actions/members'
import { getSuggestionsPending } from '@/server-actions/suggestions'
import type { SuggestionWithProposer } from '@/lib/types/database'

export default async function AppLayout({
  children: _children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [
    { data: persons },
    { data: branches },
    { data: relationships },
    { data: personBranches },
    { data: memberRow },
    { data: membersData },
    { count: memberCount },
    pendingSuggestionsData,
  ] = await Promise.all([
    supabase.from('person').select('*').order('nom'),
    supabase.from('branch').select('*').order('nom'),
    supabase.from('relationship').select('*'),
    supabase.from('person_branch').select('*'),
    supabase.from('tree_member').select('role').eq('user_id', user.id).single(),
    supabase.from('tree_member').select('*, users(email, display_name)'),
    supabase.from('tree_member').select('*', { count: 'exact', head: true }),
    getSuggestionsPending(),
  ])

  // If no tree_member row for this user:
  // - If no members exist at all → user is the founder → ADMIN
  // - Otherwise → unknown user → VIEWER
  const currentRole: Role = memberRow?.role
    ? (memberRow.role as Role)
    : (memberCount === 0 ? 'ADMIN' : 'VIEWER')

  return (
    <ThemeProvider>
      <AppShell
        userEmail={user.email ?? ''}
        initialPersons={(persons ?? []) as Person[]}
        initialBranches={(branches ?? []) as Branch[]}
        initialRelationships={(relationships ?? []) as Relationship[]}
        initialPersonBranches={(personBranches ?? []) as PersonBranch[]}
        currentRole={currentRole}
        initialMembers={(membersData ?? []) as MemberWithUser[]}
        initialPendingSuggestions={pendingSuggestionsData}
      />
    </ThemeProvider>
  )
}
