// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Role } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error, data } = await supabase.auth.exchangeCodeForSession(code)
    if (!error && data.user) {
      const user = data.user
      const invitedRole = user.user_metadata?.role as Role | undefined

      if (invitedRole) {
        // Ensure user is in public users table
        await supabase.from('users').upsert({
          id: user.id,
          email: user.email ?? '',
          display_name: (user.email ?? '').split('@')[0],
        })

        // Create tree_member if it doesn't exist yet (idempotent)
        await supabase.from('tree_member').upsert(
          { user_id: user.id, role: invitedRole },
          { onConflict: 'user_id', ignoreDuplicates: true }
        )
      }

      return NextResponse.redirect(`${origin}/tree`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
