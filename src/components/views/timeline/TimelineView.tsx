'use client'
import { useMemo, useRef } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { useScrollSelectedIntoView } from '@/lib/hooks/useScrollSelectedIntoView'
import { EmptyTreeState } from '@/components/shared/EmptyTreeState'
import { OrphanPanel } from '@/components/shared/OrphanPanel'
import './timeline.css'

const CARD_W = 236 // 220 card + 16 gap
const BASE_WIDTH = 1600
const PADDING = 80
const AXIS_Y = 190

function getInitials(prenom: string, nom: string): string {
  return (prenom[0] ?? '') + (nom[0] ?? '')
}

interface PositionedPerson {
  id: string
  prenom: string
  nom: string
  year: number
  deceased: boolean
  selected: boolean
  x: number
}

function resolveOverlaps(arr: PositionedPerson[]): void {
  for (let i = 1; i < arr.length; i++) {
    const minX = arr[i - 1].x + CARD_W
    if (arr[i].x < minX) {
      arr[i].x = minX
    }
  }
}

export function TimelineView() {
  const { persons, selectedPersonId, selectPerson, openAddPerson } = useTree()
  const containerRef = useRef<HTMLDivElement>(null)
  useScrollSelectedIntoView(containerRef, selectedPersonId)

  const withDate = useMemo(() => persons.filter(p => p.date_naissance !== null), [persons])
  const unplaced = useMemo(() => persons.filter(p => p.date_naissance === null), [persons])

  const { abovePos, belowPos, totalWidth, minYear, maxYear, range } = useMemo(() => {
    const sorted = [...withDate].sort((a, b) =>
      new Date(a.date_naissance!).getFullYear() - new Date(b.date_naissance!).getFullYear()
    )

    const years = sorted.map(p => new Date(p.date_naissance!).getFullYear())
    const min = years.length > 0 ? Math.min(...years) : 1900
    const max = years.length > 0 ? Math.max(...years) : 2000
    const r = max - min || 1

    const positioned: PositionedPerson[] = sorted.map(p => ({
      id: p.id,
      prenom: p.prenom,
      nom: p.nom,
      year: new Date(p.date_naissance!).getFullYear(),
      deceased: p.date_deces != null,
      selected: p.id === selectedPersonId,
      x: PADDING + ((new Date(p.date_naissance!).getFullYear() - min) / r) * BASE_WIDTH,
    }))

    const above = positioned.filter((_, i) => i % 2 === 0)
    const below = positioned.filter((_, i) => i % 2 !== 0)

    resolveOverlaps(above)
    resolveOverlaps(below)

    const allX = [...above, ...below].map(p => p.x)
    const tw = Math.max(BASE_WIDTH + PADDING * 2, Math.max(...allX) + CARD_W + PADDING)

    return { abovePos: above, belowPos: below, totalWidth: tw, minYear: min, maxYear: max, range: r }
  }, [withDate, selectedPersonId])

  const selectedIsUnplaced = selectedPersonId != null && unplaced.some(p => p.id === selectedPersonId)

  if (persons.length === 0) {
    return <EmptyTreeState onAddPerson={openAddPerson} />
  }

  // Year markers every 25 years
  const startDecade = Math.floor(minYear / 25) * 25
  const yearMarkers: { year: number; x: number }[] = []
  for (let y = startDecade; y <= maxYear + 10; y += 25) {
    yearMarkers.push({ year: y, x: PADDING + ((y - minYear) / range) * BASE_WIDTH })
  }

  const renderCard = (p: PositionedPerson, isAbove: boolean) => {
    const initials = getInitials(p.prenom, p.nom)
    return (
      <div
        key={p.id}
        className={`timeline__unit ${isAbove ? 'timeline__unit--above' : 'timeline__unit--below'}${p.selected ? ' timeline__unit--selected' : ''}`}
        style={{ left: p.x }}
        onClick={() => selectPerson(p.id)}
        data-person-id={p.id}
      >
        {isAbove ? (
          <>
            <div className="timeline__card">
              <div className="timeline__card-name">
                <span className="timeline__card-icon timeline__card-icon--unknown">{initials}</span>
                {p.prenom} {p.nom}
                {p.deceased && <span className="timeline__deceased">†</span>}
              </div>
              <div className="timeline__card-meta">
                {p.year}{!p.deceased && ' · Vivant'}
              </div>
            </div>
            <div className="timeline__connector" />
            <div className="timeline__dot" />
          </>
        ) : (
          <>
            <div className="timeline__dot" />
            <div className="timeline__connector" />
            <div className="timeline__card">
              <div className="timeline__card-name">
                <span className="timeline__card-icon timeline__card-icon--unknown">{initials}</span>
                {p.prenom} {p.nom}
                {p.deceased && <span className="timeline__deceased">†</span>}
              </div>
              <div className="timeline__card-meta">
                {p.year}{!p.deceased && ' · Vivant'}
              </div>
            </div>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="timeline" ref={containerRef}>
      <div className="timeline__axis" style={{ minWidth: totalWidth }}>
        {/* Axis line */}
        <div className="timeline__line" />

        {/* Year markers */}
        {yearMarkers.map(m => (
          <div key={m.year} className="timeline__year" style={{ left: m.x }}>
            <div className="timeline__year-tick" />
            <div className="timeline__year-label">{m.year}</div>
          </div>
        ))}

        {/* Person units */}
        {abovePos.map(p => renderCard(p, true))}
        {belowPos.map(p => renderCard(p, false))}
      </div>

      <OrphanPanel
        orphanIds={unplaced.map(p => p.id)}
        persons={persons}
        onSelectPerson={selectPerson}
        label={`${unplaced.length} sans date de naissance`}
      />
    </div>
  )
}
