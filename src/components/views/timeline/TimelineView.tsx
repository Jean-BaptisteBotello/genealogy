'use client'
import { useTree } from '@/lib/context/tree-context'

const SVG_W = 1200
const SVG_H = 400
const AXIS_Y = 200
const PADDING = 80
const LABEL_OFFSET_UP = -55
const LABEL_OFFSET_DOWN = 45

export function TimelineView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary, white)' }}>Votre arbre vous attend</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-secondary, #6b7280)' }}>Commencez par ajouter la première personne.</p>
          <button
            type="button"
            onClick={openAddPerson}
            className="px-4 py-2 bg-red-500 text-white rounded-md text-sm hover:bg-red-600 transition-colors"
          >
            + Ajouter une personne
          </button>
        </div>
      </div>
    )
  }

  const withDate = persons.filter(p => p.date_naissance !== null)
  const unplaced = persons.filter(p => p.date_naissance === null)

  const sorted = [...withDate].sort((a, b) =>
    new Date(a.date_naissance!).getFullYear() - new Date(b.date_naissance!).getFullYear()
  )

  const years = sorted.map(p => new Date(p.date_naissance!).getFullYear())
  const minYear = years.length > 0 ? Math.min(...years) : 1900
  const maxYear = years.length > 0 ? Math.max(...years) : 2000
  const range = maxYear - minYear || 1

  const toX = (year: number) =>
    PADDING + ((year - minYear) / range) * (SVG_W - PADDING * 2)

  return (
    <div className="w-full h-full overflow-auto p-6">
      {sorted.length > 0 && (
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minHeight: SVG_H }}
        >
          {/* Axis line */}
          <line
            x1={PADDING} y1={AXIS_Y}
            x2={SVG_W - PADDING} y2={AXIS_Y}
            stroke="#1e3a5f" strokeWidth={2}
          />

          {/* Min/max year labels */}
          <text x={PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {minYear}
          </text>
          <text x={SVG_W - PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {maxYear}
          </text>

          {/* Persons */}
          {sorted.map((person, index) => {
            const year = new Date(person.date_naissance!).getFullYear()
            const cx = toX(year)
            const isSelected = person.id === selectedPersonId
            const isAbove = index % 2 === 0
            const labelY = AXIS_Y + (isAbove ? LABEL_OFFSET_UP : LABEL_OFFSET_DOWN)

            return (
              <g
                key={person.id}
                style={{ cursor: 'pointer' }}
                onClick={() => selectPerson(person.id)}
              >
                {/* Connecting line from circle to label */}
                <line
                  x1={cx} y1={AXIS_Y}
                  x2={cx} y2={isAbove ? labelY + 14 : labelY - 6}
                  stroke={isSelected ? '#3b82f6' : '#cbd5e1'}
                  strokeWidth={1}
                  strokeDasharray="3 2"
                />

                {/* Circle on axis */}
                <circle
                  cx={cx} cy={AXIS_Y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#3b82f6' : '#60a5fa'}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={2}
                />

                {/* Name label */}
                <foreignObject
                  x={cx - 70} y={isAbove ? labelY - 10 : labelY - 6}
                  width={140} height={40}
                  style={{ overflow: 'visible' }}
                >
                  <div
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      lineHeight: '1.3',
                      color: isSelected ? '#3b82f6' : 'white',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {person.prenom} {person.nom}
                    </div>
                    <div style={{ color: '#6b7280', fontSize: 9 }}>{year}</div>
                  </div>
                </foreignObject>
              </g>
            )
          })}
        </svg>
      )}

      {unplaced.length > 0 && (
        <div className="mt-4 text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-3 py-2 inline-block">
          {unplaced.length} non placée{unplaced.length > 1 ? 's' : ''} sur la timeline (sans date de naissance)
        </div>
      )}
    </div>
  )
}
