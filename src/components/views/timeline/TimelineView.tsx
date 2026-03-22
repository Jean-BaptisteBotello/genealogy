'use client'
import { useTree } from '@/lib/context/tree-context'

const SVG_W = 1200
const SVG_H = 200
const AXIS_Y = 100
const PADDING = 60

export function TimelineView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">📅</div>
          <h2 className="text-xl font-semibold text-white mb-2">Votre arbre vous attend</h2>
          <p className="text-sm text-gray-500 mb-6">Commencez par ajouter la première personne.</p>
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

  const years = withDate.map(p => new Date(p.date_naissance!).getFullYear())
  const minYear = years.length > 0 ? Math.min(...years) : 1900
  const maxYear = years.length > 0 ? Math.max(...years) : 2000
  const range = maxYear - minYear || 1

  const toX = (year: number) =>
    PADDING + ((year - minYear) / range) * (SVG_W - PADDING * 2)

  return (
    <div className="w-full h-full overflow-auto p-6">
      {withDate.length > 0 && (
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full"
          style={{ minHeight: SVG_H }}
        >
          <line
            x1={PADDING} y1={AXIS_Y}
            x2={SVG_W - PADDING} y2={AXIS_Y}
            stroke="#1e3a5f" strokeWidth={2}
          />
          <text x={PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {minYear}
          </text>
          <text x={SVG_W - PADDING} y={AXIS_Y + 20} fill="#6b7280" fontSize={11} textAnchor="middle">
            {maxYear}
          </text>
          {withDate.map(person => {
            const year = new Date(person.date_naissance!).getFullYear()
            const cx = toX(year)
            const isSelected = person.id === selectedPersonId
            return (
              <g
                key={person.id}
                style={{ cursor: 'pointer' }}
                onClick={() => selectPerson(person.id)}
              >
                <circle
                  cx={cx} cy={AXIS_Y}
                  r={isSelected ? 7 : 5}
                  fill={isSelected ? '#3b82f6' : '#60a5fa'}
                  stroke={isSelected ? '#fff' : 'none'}
                  strokeWidth={2}
                />
                <foreignObject
                  x={cx - 60} y={AXIS_Y - 30}
                  width={120} height={20}
                  style={{ overflow: 'visible' }}
                >
                  <span
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      color: 'white',
                      fontSize: 10,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {person.prenom} {person.nom}
                  </span>
                </foreignObject>
                <text
                  x={cx} y={AXIS_Y + 32}
                  textAnchor="middle" fill="#6b7280" fontSize={9}
                >
                  {year}
                </text>
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
