import type { Person } from '@/lib/types/database'

interface CosmosTooltipProps {
  person: Person
  x: number
  y: number
}

function formatYear(date: string | null): string {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

export function CosmosTooltip({ person, x, y }: CosmosTooltipProps) {
  const birthYear = formatYear(person.date_naissance)
  const deathYear = formatYear(person.date_deces)
  const dates = [birthYear, deathYear].filter(Boolean).join(' – ')

  const W = 160
  const H = 60
  const tx = x + 30
  const ty = y - H / 2

  return (
    <foreignObject x={tx} y={ty} width={W} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div
        style={{
          background: '#0d1117',
          border: '1px solid #1e3a5f',
          borderRadius: 6,
          padding: '6px 10px',
          color: 'white',
          fontSize: 12,
          lineHeight: 1.4,
          whiteSpace: 'nowrap',
        }}
      >
        <div style={{ fontWeight: 600 }}>{person.prenom} {person.nom}</div>
        {dates && <div style={{ color: '#9ca3af' }}>{dates}</div>}
        {person.lieu_naissance && <div style={{ color: '#6b7280', fontSize: 11 }}>{person.lieu_naissance}</div>}
      </div>
    </foreignObject>
  )
}
