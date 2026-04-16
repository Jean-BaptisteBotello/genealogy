'use client'
import { useTree } from '@/lib/context/tree-context'
import { LinkPersonForm } from './LinkPersonForm'
import { Button } from '@/components/ui/Button'

interface Props {
  createdPerson: { id: string; prenom: string; nom: string }
  onDone: () => void
}

export function InlineLinkStep({ createdPerson, onDone }: Props) {
  const { persons } = useTree()
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-white font-semibold text-base">
        Lier {createdPerson.prenom} {createdPerson.nom} à…
      </h2>
      <p className="text-xs text-gray-400">
        Rattache {createdPerson.prenom} à quelqu'un qui est déjà dans l'arbre. Tu peux faire ça plus tard depuis sa fiche.
      </p>
      <LinkPersonForm
        currentPersonId={createdPerson.id}
        persons={persons}
        onClose={onDone}
      />
      <div className="flex justify-end">
        <Button type="button" variant="ghost" onClick={onDone}>
          Plus tard
        </Button>
      </div>
    </div>
  )
}
