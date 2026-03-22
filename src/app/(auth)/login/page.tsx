'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { login } from '@/server-actions/auth'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await login(new FormData(e.currentTarget))
    if (result?.error) { setError(result.error); setLoading(false) }
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Généalogie</h1>
          <p className="text-sm text-gray-500 mt-1">Connectez-vous à votre arbre</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" id="email" name="email" type="email" required placeholder="vous@exemple.com" />
          <Input label="Mot de passe" id="password" name="password" type="password" required placeholder="••••••••" />
          {error && <p className="text-sm text-red-400 text-center">{error}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-6">
          Pas encore de compte ?{' '}
          <Link href="/signup" className="text-blue-400 hover:underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  )
}
