'use client'

export function Sidebar() {
  return (
    <aside className="w-48 bg-[#080d16] border-r border-[#1e3a5f] flex flex-col gap-1 p-3 overflow-y-auto shrink-0">
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1">Branches</div>
      <button className="text-left text-xs text-blue-300 bg-blue-900/20 px-2 py-1.5 rounded border-l-2 border-blue-400">
        🌿 Toutes les branches
      </button>
      {/* Branch list — populated dynamically in Plan 2 */}
      <div className="text-xs text-gray-600 px-2 py-1 italic">Aucune branche</div>
      <button className="text-left text-[10px] text-gray-600 px-2 py-1 hover:text-gray-400">
        + Nouvelle branche
      </button>
      <div className="flex-1" />
      <div className="text-[10px] text-gray-600 uppercase tracking-widest mb-1 mt-3">Filtres</div>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-green-500" /> Vivants
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-gray-400" /> Décédés
      </label>
      <label className="flex items-center gap-2 text-xs text-gray-500 px-2 py-1 cursor-pointer hover:text-gray-300">
        <input type="checkbox" className="accent-yellow-500" /> Avec documents
      </label>
      <div className="border-t border-[#1e3a5f] mt-3 pt-3">
        <button className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">👥 Gérer les accès</button>
        <button className="text-left text-xs text-gray-500 px-2 py-1 hover:text-gray-300 w-full">⚙️ Paramètres</button>
      </div>
    </aside>
  )
}
