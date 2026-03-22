// src/app/(app)/layout.tsx
// Server Component — no 'use client' directive
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import type { Person, Branch, Relationship, PersonBranch } from '@/lib/types/database'

export default async function AppLayout({
  children,
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
  ] = await Promise.all([
    supabase.from('person').select('*').order('nom'),
    supabase.from('branch').select('*').order('nom'),
    supabase.from('relationship').select('*'),
    supabase.from('person_branch').select('*'),
  ])

  return (
    <AppShell
      userEmail={user.email ?? ''}
      initialPersons={(persons ?? []) as Person[]}
      initialBranches={(branches ?? []) as Branch[]}
      initialRelationships={(relationships ?? []) as Relationship[]}
      initialPersonBranches={(personBranches ?? []) as PersonBranch[]}
    >
      {children}
    </AppShell>
  )
}
