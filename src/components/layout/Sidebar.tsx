// src/components/layout/Sidebar.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Branch, Role } from '@/lib/types/database'
import { BranchModal } from '@/components/branch/BranchModal'
import { deleteBranch, createBranch, assignPersonToBranch } from '@/server-actions/branches'
import { useTree } from '@/lib/context/tree-context'
import { detectBranches } from '@/lib/branch-detection'

interface SidebarProps {
  branches: Branch[]
  currentRole: Role
  onManageMembers: () => void
}

export function Sidebar({ branches, currentRole, onManageMembers }: SidebarProps) {
  const router = useRouter()
  const { persons, relationships, selectedPersonId, showFamily, setShowFamily, showExtendedFamily, setShowExtendedFamily, showToast } = useTree()
  const [detecting, setDetecting] = useState(false)
  const [branchModalMode, setBranchModalMode] = useState<
    'add' | { type: 'edit'; branch: Branch } | null
  >(null)
  const [activeBranchId, setActiveBranchId] = useState<string | 'all'>('all')

  async function handleDetectBranches() {
    const centerId = selectedPersonId ?? persons[0]?.id
    if (!centerId) return
    setDetecting(true)
    try {
      const detected = detectBranches(persons, relationships, centerId)
      if (detected.length === 0) {
        showToast('Aucune branche détectée. Ajoutez des liens parent-enfant.', 'info')
        return
      }
      for (const branch of detected) {
        const form = new FormData()
        form.set('nom', branch.name)
        form.set('couleur', branch.color)
        form.set('description', '')
        const result = await createBranch(form)
        if (result.id) {
          for (const memberId of branch.members) {
            await assignPersonToBranch(memberId, result.id)
          }
        }
      }
      router.refresh()
      showToast(`${detected.length} branche${detected.length > 1 ? 's' : ''} détectée${detected.length > 1 ? 's' : ''}.`, 'info')
    } finally {
      setDetecting(false)
    }
  }

  async function handleDeleteBranch(branch: Branch) {
    if (!confirm(`Supprimer la branche « ${branch.nom} » ?`)) return
    const result = await deleteBranch(branch.id)
    if (!result.error) router.refresh()
  }

  return (
    <>
      <aside className="w-48 flex flex-col gap-1 p-3 overflow-y-auto shrink-0" style={{ background: 'var(--sidebar-bg)', borderRight: '1px solid var(--sidebar-border)' }}>
        <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'var(--section-label)' }}>Branches</div>

        <button
          type="button"
          onClick={() => setActiveBranchId('all')}
          className={[
            'text-left text-xs px-2 py-1.5 rounded border-l-2 transition-colors',
            activeBranchId === 'all'
              ? 'text-blue-300 bg-blue-900/20 border-blue-400'
              : 'text-gray-500 bg-transparent border-transparent hover:text-gray-300 hover:bg-white/5',
          ].join(' ')}
        >
          🌿 Toutes les branches
        </button>

        {branches.length === 0 ? (
          <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
        ) : (
          branches.map(branch => (
            <div key={branch.id} className="group flex items-center">
              <button
                type="button"
                onClick={() => setActiveBranchId(branch.id)}
                className={[
                  'flex-1 text-left text-xs px-2 py-1.5 rounded flex items-center gap-2 transition-colors',
                  activeBranchId === branch.id
                    ? 'text-white bg-white/10'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5',
                ].join(' ')}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: branch.couleur }}
                />
                <span className="truncate">{branch.nom}</span>
              </button>
              {currentRole !== 'VIEWER' && (
                <button
                  type="button"
                  onClick={() => setBranchModalMode({ type: 'edit', branch })}
                  className="hidden group-hover:flex text-gray-600 hover:text-gray-300 text-[10px] px-1"
                  title="Modifier"
                >
                  ✎
                </button>
              )}
              {currentRole === 'ADMIN' && (
                <button
                  type="button"
                  onClick={() => handleDeleteBranch(branch)}
                  className="hidden group-hover:flex text-gray-600 hover:text-red-400 text-[10px] px-1"
                  title="Supprimer"
                >
                  ✕
                </button>
              )}
            </div>
          ))
        )}

        {currentRole !== 'VIEWER' && (
          <div className="flex flex-col gap-0.5 mt-1">
            <button
              type="button"
              onClick={() => setBranchModalMode('add')}
              className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400"
            >
              + Nouvelle branche
            </button>
            <button
              type="button"
              onClick={handleDetectBranches}
              disabled={detecting}
              className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400 disabled:opacity-40"
            >
              {detecting ? 'Détection...' : '🔍 Détecter les branches'}
            </button>
          </div>
        )}

        <div className="flex-1" />

        <div className="text-[10px] uppercase tracking-widest mb-1 mt-3" style={{ color: 'var(--section-label)' }}>Filtres</div>
        <label htmlFor="filter-famille" className="flex items-center gap-2 text-xs px-2 py-1 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input id="filter-famille" name="filter-famille" type="checkbox" className="accent-blue-500" checked={showFamily} onChange={e => setShowFamily(e.target.checked)} /> Famille
        </label>
        <label htmlFor="filter-etendue" className="flex items-center gap-2 text-xs px-2 py-1 cursor-pointer" style={{ color: 'var(--text-secondary)' }}>
          <input id="filter-etendue" name="filter-etendue" type="checkbox" className="accent-purple-500" checked={showExtendedFamily} onChange={e => setShowExtendedFamily(e.target.checked)} /> Famille étendue
        </label>

        <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--divider)' }}>
          <button type="button" onClick={onManageMembers} className="text-left text-xs px-2 py-1 w-full" style={{ color: 'var(--text-secondary)' }}>👥 Gérer les accès</button>
          <button type="button" className="text-left text-xs px-2 py-1 w-full" style={{ color: 'var(--text-secondary)' }}>⚙️ Paramètres</button>
        </div>
      </aside>

      {branchModalMode !== null && (
        <BranchModal
          mode={branchModalMode}
          onClose={() => setBranchModalMode(null)}
        />
      )}
    </>
  )
}
