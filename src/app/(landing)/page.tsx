import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { LandingTopbar } from './components/LandingTopbar'
import { HeroSection } from './components/HeroSection'
import { ProblemSection } from './components/ProblemSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { FormsSection } from './components/FormsSection'
import { FaqSection } from './components/FaqSection'
import { CtaSection } from './components/CtaSection'
import { LandingFooter } from './components/LandingFooter'

// Revalidate the waitlist count every 5 minutes — dynamic enough to feel
// alive, quiet enough to avoid hammering Supabase on every request.
export const revalidate = 300

async function getWaitlistCount(): Promise<number | undefined> {
  try {
    const admin = createAdminClient()
    const { count, error } = await admin
      .from('waitlist_signups')
      .select('*', { head: true, count: 'exact' })
    if (error) return undefined
    return count ?? undefined
  } catch {
    return undefined
  }
}

export default async function LandingPage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {}

  const waitlistCount = await getWaitlistCount()

  return (
    <main className="mx-auto flex flex-col gap-6" style={{ maxWidth: 1180, padding: '0 32px 32px' }}>
      <LandingTopbar isAuthenticated={isAuthenticated} />
      <HeroSection isAuthenticated={isAuthenticated} />
      <ProblemSection />
      <HowItWorksSection />
      <FormsSection />
      <FaqSection />
      <CtaSection isAuthenticated={isAuthenticated} waitlistCount={waitlistCount} />
      <LandingFooter />
    </main>
  )
}
