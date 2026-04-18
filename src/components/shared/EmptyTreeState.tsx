interface EmptyTreeStateProps {
  onAddPerson: () => void
}

export function EmptyTreeState({ onAddPerson }: EmptyTreeStateProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 12,
        background: '#f8f8f6',
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          background: 'rgba(124, 58, 237, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          color: '#7c3aed',
          marginBottom: 4,
        }}
      >
        ⧖
      </div>
      <div style={{ fontSize: 16, color: '#3a3a3a', fontWeight: 500 }}>
        Votre arbre vous attend
      </div>
      <div style={{ fontSize: 13, color: '#8a8580', maxWidth: 280, textAlign: 'center' }}>
        Commencez par ajouter la première personne.
      </div>
      <button
        type="button"
        onClick={onAddPerson}
        style={{
          marginTop: 4,
          padding: '8px 20px',
          background: '#7c3aed',
          color: 'white',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        + Ajouter une personne
      </button>
    </div>
  )
}
