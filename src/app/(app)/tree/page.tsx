export default function TreePage() {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🌳</div>
        <h2 className="text-xl font-semibold text-white mb-2">Votre arbre vous attend</h2>
        <p className="text-sm text-gray-500 mb-6">Commencez par ajouter la première personne.</p>
        <button className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors">
          + Ajouter une personne
        </button>
      </div>
    </div>
  )
}
