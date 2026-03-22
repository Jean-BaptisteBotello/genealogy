// src/components/layout/Sidebar.tsx
'use client'
import type { Branch } from '@/lib/types/database'

interface SidebarProps {
  branches: Branch[]
}

export function Sidebar({ branches }: SidebarProps) {
  return (
    <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>
      <button
        type="button"
        className="text-left text-xs text-blue-300 bg-blue-900/20 px-2 py-1.5 rounded border-l-2 border-blue-400"
      >
        🌿 Toutes les branches
      </button>
      {branches.length === 0 ? (
        <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
      ) : (
        branches.map(branch => (
          <button
            key={branch.id}
            type="button"
            className="text-left text-xs text-gray-300 px-2 py-1.5 rounded hover:bg-white/5 flex items-center gap-2"
          >
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: branch.couleur }}
            />
            {branch.nom}
          </button>
        ))
      )}
      <button
        type="button"
        className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400"
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
  )
}
