import type { Person } from '@/lib/types/database'

interface FormPreviewCardProps {
  person: Person
}

export function FormPreviewCard({ person }: FormPreviewCardProps) {
  const dateNaissance = person.date_naissance
    ? new Date(person.date_naissance).toLocaleDateString('fr-FR')
    : null
  const lieu = person.lieu_naissance

  const fields = [
    { label: 'Nom', value: person.nom.toUpperCase() },
    { label: 'Prénoms', value: person.prenom },
    {
      label: 'Naissance',
      value: [dateNaissance, lieu ? `à ${lieu}` : null].filter(Boolean).join(' '),
    },
  ]

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid #e5e2dd',
        borderRadius: 8,
        padding: '10px 14px',
        fontSize: 10,
        color: '#8a8580',
        marginTop: 10,
      }}
    >
      <div style={{ fontWeight: 600, color: '#1a1a1a', fontSize: 11, marginBottom: 6 }}>
        Cerfa 3233 — Aperçu
      </div>
      {fields.map(f => (
        <div
          key={f.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 0',
            borderBottom: '1px solid #f0eeeb',
          }}
        >
          <span>{f.label}</span>
          <span style={{ color: '#7c3aed', fontWeight: 500 }}>{f.value || '—'}</span>
        </div>
      ))}
    </div>
  )
}
