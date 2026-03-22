// src/components/layout/Sidebar.tsx
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Branch } from '@/lib/types/database'
import { BranchModal } from '@/components/branch/BranchModal'
import { deleteBranch } from '@/server-actions/branches'

interface SidebarProps {
  branches: Branch[]
}

export function Sidebar({ branches }: SidebarProps) {
  const router = useRouter()
  const [branchModalMode, setBranchModalMode] = useState<
    'add' | { type: 'edit'; branch: Branch } | null
  >(null)
  const [activeBranchId, setActiveBranchId] = useState<string | 'all'>('all')

  async function handleDeleteBranch(branch: Branch) {
    if (!confirm(`Supprimer la branche « ${branch.nom} » ?`)) return
    const result = await deleteBranch(branch.id)
    if (!result.error) router.refresh()
  }

  return (
    <>
      <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>

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
              <button
                type="button"
                onClick={() => setBranchModalMode({ type: 'edit', branch })}
                className="hidden group-hover:flex text-gray-600 hover:text-gray-300 text-[10px] px-1"
                title="Modifier"
              >
                ✎
              </button>
              <button
                type="button"
                onClick={() => handleDeleteBranch(branch)}
                className="hidden group-hover:flex text-gray-600 hover:text-red-400 text-[10px] px-1"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))
        )}

        <button
          type="button"
          onClick={() => setBranchModalMode('add')}
          className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400 mt-1"
        >
          + Nouvelle branche
        </button>

        <div className="flex-1" />

        <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 mt-3">Filtres</div>
        <label htmlFor="filter-vivants" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-vivants" name="filter-vivants" type="checkbox" className="accent-green-500" /> Vivants
        </label>
        <label htmlFor="filter-decedes" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-decedes" name="filter-decedes" type="checkbox" className="accent-gray-400" /> Décédés
        </label>
        <label htmlFor="filter-avec-documents" className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
          <input id="filter-avec-documents" name="filter-avec-documents" type="checkbox" className="accent-yellow-500" /> Avec documents
        </label>

        <div className="border-t border-[#1e3a5f] mt-3 pt-3">
          <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">👥 Gérer les accès</button>
          <button type="button" className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">⚙️ Paramètres</button>
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
