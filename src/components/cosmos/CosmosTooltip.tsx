// src/components/cosmos/CosmosTooltip.tsx
import type { Person } from '@/lib/types/database'

interface CosmosTooltipProps {
  person: Person
  role: string
  x: number
  y: number
}

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export function CosmosTooltip({ person, role, x, y }: CosmosTooltipProps) {
  const birthYear = formatYear(person.date_naissance)
  const deathYear = formatYear(person.date_deces)
  const deceased = person.date_deces !== null

  return (
    <div
      style={{
        position: 'fixed',
        left: x + 14,
        top: y - 10,
        pointerEvents: 'none',
        zIndex: 20,
        background: 'rgba(255,245,250,0.92)',
        border: '1px solid rgba(160,110,130,0.25)',
        borderRadius: 6,
        padding: '7px 11px',
        backdropFilter: 'blur(8px)',
        minWidth: 120,
      }}
    >
      <div style={{ color: '#5a3545', fontSize: 12, fontWeight: 600, letterSpacing: '0.02em' }}>
        {person.prenom} {person.nom}
      </div>
      <div style={{ color: '#9c7888', fontSize: 10, marginTop: 2 }}>
        {birthYear}{deceased && deathYear ? ` – † ${deathYear}` : ''}
      </div>
      <div style={{ color: '#a06878', fontSize: 10, marginTop: 1 }}>{role}</div>
    </div>
  )
}
