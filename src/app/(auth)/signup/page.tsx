'use client'
import { useState } from 'react'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { signup } from '@/server-actions/auth'
import Link from 'next/link'

export default function SignupPage() {
  const [message, setMessage] = useState<{ error?: string; success?: string } | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    const result = await signup(new FormData(e.currentTarget))
    setMessage(result ?? null)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#050a14] flex items-center justify-center">
      <div className="w-full max-w-sm p-8 bg-[#080d16] border border-[#1e3a5f] rounded-xl">
        <div className="text-center mb-8">
          <div className="text-3xl mb-2">🌳</div>
          <h1 className="text-xl font-bold text-white">Créer un compte</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input label="Email" id="email" name="email" type="email" required placeholder="vous@exemple.com" />
          <Input label="Mot de passe" id="password" name="password" type="password" required placeholder="8 caractères minimum" minLength={8} />
          {message?.error && <p className="text-sm text-red-400 text-center">{message.error}</p>}
          {message?.success && <p className="text-sm text-green-400 text-center">{message.success}</p>}
          <Button type="submit" disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </Button>
        </form>
        <p className="text-center text-xs text-gray-600 mt-6">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-blue-400 hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
