// src/components/person/PersonModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createPerson, updatePerson } from '@/server-actions/persons'
import { InlineLinkStep } from './InlineLinkStep'
import type { Person } from '@/lib/types/database'

type AddMode = 'add'
type EditMode = { type: 'edit'; person: Person }

interface PersonModalProps {
  mode: AddMode | EditMode
  onClose: () => void
}

export function PersonModal({ mode, onClose }: PersonModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [createdPerson, setCreatedPerson] = useState<{ id: string; prenom: string; nom: string } | null>(null)

  const isEdit = mode !== 'add'
  const person = isEdit ? (mode as EditMode).person : null

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    const prenom = String(formData.get('prenom') ?? '').trim()
    const nom = String(formData.get('nom') ?? '').trim()

    startTransition(async () => {
      if (isEdit) {
        const result = await updatePerson(formData)
        if (result.error) {
          setError(result.error)
          return
        }
        router.refresh()
        onClose()
      } else {
        const result = await createPerson(formData)
        if (result.error) {
          setError(result.error)
          return
        }
        router.refresh()
        if (result.id) {
          setCreatedPerson({ id: result.id, prenom, nom })
        } else {
          onClose()
        }
      }
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg w-full max-w-md p-6 flex flex-col gap-4">
        {createdPerson ? (
          <InlineLinkStep createdPerson={createdPerson} onDone={onClose} />
        ) : (
        <>
        <h2 className="text-white font-semibold text-base">
          {isEdit ? 'Modifier' : 'Ajouter une personne'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isEdit && (
            <input type="hidden" name="id" value={person!.id} />
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="prenom"
              name="prenom"
              label="Prénom"
              defaultValue={person?.prenom ?? ''}
              required
              autoFocus
            />
            <Input
              id="nom"
              name="nom"
              label="Nom"
              defaultValue={person?.nom ?? ''}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date_naissance"
              name="date_naissance"
              label="Date de naissance"
              type="date"
              defaultValue={person?.date_naissance ?? ''}
            />
            <Input
              id="lieu_naissance"
              name="lieu_naissance"
              label="Lieu de naissance"
              defaultValue={person?.lieu_naissance ?? ''}
              placeholder="ex. Paris, France"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              id="date_deces"
              name="date_deces"
              label="Date de décès"
              type="date"
              defaultValue={person?.date_deces ?? ''}
            />
            <Input
              id="lieu_deces"
              name="lieu_deces"
              label="Lieu de décès"
              defaultValue={person?.lieu_deces ?? ''}
              placeholder="ex. Sceaux, France"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="notes" className="text-xs text-gray-400 uppercase tracking-wider">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              defaultValue={person?.notes ?? ''}
              rows={3}
              className="bg-[#0d1117] border border-[#1e3a5f] rounded-md px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-red-500 transition-colors resize-none"
              placeholder="Informations complémentaires…"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? '…' : isEdit ? 'Enregistrer' : 'Ajouter'}
            </Button>
          </div>
        </form>
        </>
        )}
      </div>
    </div>
  )
}
