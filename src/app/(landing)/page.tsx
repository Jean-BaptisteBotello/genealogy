import { createClient } from '@/lib/supabase/server'
import { LandingTopbar } from './components/LandingTopbar'
import { HeroSection } from './components/HeroSection'

export default async function LandingPage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {}

  return (
    <main className="mx-auto" style={{ maxWidth: 1180, padding: '0 32px 64px' }}>
      <LandingTopbar isAuthenticated={isAuthenticated} />
      <HeroSection />
    </main>
  )
}
