'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useRouter } from 'next/navigation'

export default function AcceptInvitePage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) { setError(error.message); setLoading(false); return }
    router.push('/tree')
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Bienvenue !</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez votre mot de passe pour accéder à l&apos;arbre.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Nouveau mot de passe" id="password" type="password" required
            value={password} onChange={e => setPassword(e.target.value)} minLength={8} />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Enregistrement...' : "Accéder à l'arbre"}
          </Button>
        </form>
      </div>
    </div>
  )
}
