'use client'
import { useEffect } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { EmptyTreeState } from '@/components/shared/EmptyTreeState'
import type { Person, Relationship } from '@/lib/types/database'

const CX = 350
const CY = 350
const CENTER_R = 35
const RING_GAP = 70

function buildAncestorMap(
  personIds: string[],
  relationships: Relationship[],
  centerId: string
): Map<string, number> {
  const gen = new Map<string, number>()
  gen.set(centerId, 0)
  const queue = [{ id: centerId, g: 0 }]
  while (queue.length > 0) {
    const { id, g } = queue.shift()!
    for (const rel of relationships) {
      if (rel.type !== 'PARENT_CHILD') continue
      if (rel.person_b_id !== id) continue // id must be the child
      const parentId = rel.person_a_id
      if (!personIds.includes(parentId) || gen.has(parentId)) continue
      gen.set(parentId, g + 1)
      queue.push({ id: parentId, g: g + 1 })
    }
  }
  return gen
}

function describeArc(
  cx: number, cy: number, r: number,
  startAngle: number, endAngle: number
): string {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const x1 = cx + r * Math.cos(toRad(startAngle))
  const y1 = cy + r * Math.sin(toRad(startAngle))
  const x2 = cx + r * Math.cos(toRad(endAngle))
  const y2 = cy + r * Math.sin(toRad(endAngle))
  const largeArc = endAngle - startAngle > 180 ? 1 : 0
  const innerR = r - RING_GAP + 4
  const ix1 = cx + innerR * Math.cos(toRad(endAngle))
  const iy1 = cy + innerR * Math.sin(toRad(endAngle))
  const ix2 = cx + innerR * Math.cos(toRad(startAngle))
  const iy2 = cy + innerR * Math.sin(toRad(startAngle))
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`
}

function initials(p: Person): string {
  return `${p.prenom[0] ?? ''}${p.nom[0] ?? ''}`.toUpperCase()
}

export function EventailView() {
  const { persons, relationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  if (persons.length === 0) {
    return <EmptyTreeState onAddPerson={openAddPerson} />
  }

  const centerId = selectedPersonId ?? persons[0].id
  const personMap = new Map(persons.map(p => [p.id, p]))
  const centerPerson = personMap.get(centerId)

  const ancestorGen = buildAncestorMap(persons.map(p => p.id), relationships, centerId)

  const byGen = new Map<number, string[]>()
  for (const [id, g] of ancestorGen) {
    if (g === 0) continue
    if (!byGen.has(g)) byGen.set(g, [])
    byGen.get(g)!.push(id)
  }

  const COLORS = ['#1e3a5f', '#1a3550', '#163045', '#122b3a', '#0e2630']

  return (
    <div className="w-full h-full overflow-auto flex items-center justify-center p-6">
      <svg viewBox="0 0 700 700" className="w-full max-w-2xl">
        {Array.from(byGen.entries()).map(([gen, ids]) => {
          const r = CENTER_R + gen * RING_GAP
          const sectorAngle = 360 / ids.length
          return ids.map((id, i) => {
            const startAngle = -90 + i * sectorAngle
            const endAngle = startAngle + sectorAngle - 2
            const midAngle = (startAngle + endAngle) / 2
            const midRad = (midAngle * Math.PI) / 180
            const textR = r - RING_GAP / 2
            const tx = CX + textR * Math.cos(midRad)
            const ty = CY + textR * Math.sin(midRad)
            const person = personMap.get(id)
            return (
              <g
                key={id}
                style={{ cursor: 'pointer' }}
                onClick={() => selectPerson(id)}
              >
                <path
                  d={describeArc(CX, CY, r, startAngle, endAngle)}
                  fill={COLORS[Math.min(gen - 1, COLORS.length - 1)]}
                  stroke="#0d1117"
                  strokeWidth={1}
                />
                {person && (
                  <foreignObject
                    x={tx - 15}
                    y={ty - 10}
                    width={30}
                    height={20}
                    style={{ overflow: 'visible', pointerEvents: 'none' }}
                  >
                    <span
                      style={{
                        display: 'block',
                        textAlign: 'center',
                        color: 'white',
                        fontSize: 10,
                      }}
                    >
                      {initials(person)}
                    </span>
                  </foreignObject>
                )}
              </g>
            )
          })
        })}

        {centerPerson && (
          <g>
            <circle cx={CX} cy={CY} r={CENTER_R} fill="#3b82f6" />
            <text
              x={CX}
              y={CY}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={13}
              fontWeight="600"
            >
              {initials(centerPerson)}
            </text>
          </g>
        )}
      </svg>
    </div>
  )
}
