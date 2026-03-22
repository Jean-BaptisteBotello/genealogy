'use client'

interface DetailPanelProps {
  isOpen: boolean
  onClose: () => void
  children?: React.ReactNode
}

export function DetailPanel({ isOpen, onClose, children }: DetailPanelProps) {
  if (!isOpen) return null

  return (
    <aside className="w-56 bg-[#080d16] border-l border-[#1e3a5f] flex flex-col shrink-0 overflow-y-auto">
      <div className="flex items-center justify-between p-3 border-b border-[#1e3a5f]">
        <span className="text-[10px] text-gray-500 uppercase tracking-widest">Détail</span>
        <button onClick={onClose} className="text-gray-600 hover:text-gray-300 text-xs">✕</button>
      </div>
      <div className="p-3 flex-1">
        {children ?? (
          <p className="text-xs text-gray-600 italic">Sélectionnez une personne</p>
        )}
      </div>
    </aside>
  )
}
