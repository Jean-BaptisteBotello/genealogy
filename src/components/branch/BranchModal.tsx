// src/components/branch/BranchModal.tsx
'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createBranch, updateBranch } from '@/server-actions/branches'
import type { Branch } from '@/lib/types/database'

type AddMode = 'add'
type EditMode = { type: 'edit'; branch: Branch }

interface BranchModalProps {
  mode: AddMode | EditMode
  onClose: () => void
}

const PRESET_COLORS: { value: string; label: string }[] = [
  { value: '#3b82f6', label: 'Bleu' },
  { value: '#ef4444', label: 'Rouge' },
  { value: '#22c55e', label: 'Vert' },
  { value: '#f59e0b', label: 'Ambre' },
  { value: '#8b5cf6', label: 'Violet' },
  { value: '#ec4899', label: 'Rose' },
  { value: '#06b6d4', label: 'Cyan' },
  { value: '#f97316', label: 'Orange' },
]

export function BranchModal({ mode, onClose }: BranchModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const isEdit = mode !== 'add'
  const branch = isEdit ? (mode as EditMode).branch : null
  const [selectedColor, setSelectedColor] = useState(branch?.couleur ?? PRESET_COLORS[0].value)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    const formData = new FormData(e.currentTarget)
    formData.set('couleur', selectedColor)

    startTransition(async () => {
      const result = isEdit
        ? await updateBranch(formData)
        : await createBranch(formData)

      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
      onClose()
    })
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-[#0d1117] border border-[#1e3a5f] rounded-lg w-full max-w-sm p-6 flex flex-col gap-4">
        <h2 className="text-white font-semibold text-base">
          {isEdit ? 'Modifier la branche' : 'Nouvelle branche'}
        </h2>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {isEdit && <input type="hidden" name="id" value={branch!.id} />}

          <Input
            id="nom"
            name="nom"
            label="Nom"
            defaultValue={branch?.nom ?? ''}
            required
            autoFocus
            placeholder="ex. Côté Maternel"
          />

          <Input
            id="description"
            name="description"
            label="Description (optionnel)"
            defaultValue={branch?.description ?? ''}
            placeholder="ex. Famille du côté de la mère"
          />

          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Couleur
            </span>
            <div
              role="group"
              aria-label="Couleur"
              className="flex gap-2 flex-wrap"
            >
              {PRESET_COLORS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedColor(value)}
                  className={[
                    'w-6 h-6 rounded-full border-2 transition-all',
                    selectedColor === value ? 'border-white scale-110' : 'border-transparent',
                  ].join(' ')}
                  style={{ backgroundColor: value }}
                  aria-label={label}
                  aria-pressed={selectedColor === value}
                />
              ))}
            </div>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-900/20 px-3 py-2 rounded">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" variant="primary" disabled={isPending}>
              {isPending ? '…' : isEdit ? 'Enregistrer' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
