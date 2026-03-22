import type { RelationshipType } from '@/lib/types/database'

interface CosmosEdgeProps {
  x1: number
  y1: number
  x2: number
  y2: number
  type: RelationshipType
}

const STROKE_BY_TYPE: Record<RelationshipType, string> = {
  UNION: '#60a5fa',
  PARENT_CHILD: '#6b7280',
  ADOPTION: '#a78bfa',
  SIBLING: '#6b7280',
  HALF_SIBLING: '#6b7280',
  STEP: '#6b7280',
}

const DASH_BY_TYPE: Partial<Record<RelationshipType, string>> = {
  ADOPTION: '4 2',
  SIBLING: '2 2',
  HALF_SIBLING: '2 2',
  STEP: '4 4',
}

export function CosmosEdge({ x1, y1, x2, y2, type }: CosmosEdgeProps) {
  // Quadratic bezier with midpoint slightly offset
  const mx = (x1 + x2) / 2
  const my = (y1 + y2) / 2 - 20

  return (
    <path
      d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
      fill="none"
      stroke={STROKE_BY_TYPE[type] ?? '#6b7280'}
      strokeWidth={1.5}
      strokeDasharray={DASH_BY_TYPE[type]}
      opacity={0.6}
      pointerEvents="none"
    />
  )
}
