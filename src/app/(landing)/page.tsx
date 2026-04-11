import { createClient } from '@/lib/supabase/server'
import { LandingTopbar } from './components/LandingTopbar'
import { HeroSection } from './components/HeroSection'
import { ProblemSection } from './components/ProblemSection'
import { HowItWorksSection } from './components/HowItWorksSection'
import { FormsSection } from './components/FormsSection'
import { FaqSection } from './components/FaqSection'
import { CtaSection } from './components/CtaSection'
import { LandingFooter } from './components/LandingFooter'

export default async function LandingPage() {
  let isAuthenticated = false
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    isAuthenticated = !!user
  } catch {}

  return (
    <main className="mx-auto flex flex-col gap-6" style={{ maxWidth: 1180, padding: '0 32px 32px' }}>
      <LandingTopbar isAuthenticated={isAuthenticated} />
      <HeroSection />
      <ProblemSection />
      <HowItWorksSection />
      <FormsSection />
      <FaqSection />
      <CtaSection />
      <LandingFooter />
    </main>
  )
}
