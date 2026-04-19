'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { useScrollSelectedIntoView } from '@/lib/hooks/useScrollSelectedIntoView'
import { computeFlowLayout } from './sablierFlowLayout'
import { EmptyTreeState } from '@/components/shared/EmptyTreeState'
import { OrphanPanel } from '@/components/shared/OrphanPanel'
import './sablierFlow.css'

const GEN_LABELS: Record<number, string> = {
  0: 'Toi',
  [-1]: 'Parents',
  [-2]: 'Grands-parents',
  [-3]: 'Arrière-grands-parents',
  [-4]: 'Trisaïeuls',
  [-5]: 'Quadrisaïeuls',
  1: 'Enfants',
  2: 'Petits-enfants',
}

function getInitials(prenom: string, nom: string): string {
  return (prenom[0] ?? '') + (nom[0] ?? '')
}

export function SablierFlowView() {
  const {
    persons, relationships, filteredRelationships,
    selectedPersonId, selectPerson, openAddPerson,
  } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  const centerId = selectedPersonId ?? persons[0]?.id ?? ''
  const personMap = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons])

  const layout = useMemo(
    () => computeFlowLayout(persons, filteredRelationships, centerId),
    [persons, filteredRelationships, centerId]
  )

  const [zoom, setZoom] = useState(1)
  const [hoveredId, setHoveredId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useScrollSelectedIntoView(containerRef, selectedPersonId)

  // Connections relevant to selected or hovered person
  const activeId = hoveredId ?? centerId
  const activeConnections = useMemo(() => {
    const set = new Set<number>()
    layout.connections.forEach((c, i) => {
      if (c.fromId === activeId || c.toId === activeId) set.add(i)
    })
    return set
  }, [layout.connections, activeId])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom(prev => Math.min(2, Math.max(0.3, prev - e.deltaY * 0.002)))
    }
  }, [])

  if (persons.length === 0) {
    return <EmptyTreeState onAddPerson={openAddPerson} />
  }

  const renderCard = (nodeId: string, x: number, y: number, role?: string, isSelected?: boolean) => {
    const p = personMap.get(nodeId)
    if (!p) return null
    const deceased = p.date_deces != null
    const year = p.date_naissance ? new Date(p.date_naissance).getFullYear() : null
    const classes = `sablier-flow__card${isSelected ? ' sablier-flow__card--selected' : ''}`
    return (
      <div
        key={nodeId}
        className={classes}
        style={{ left: x, top: y }}
        onClick={() => selectPerson(nodeId)}
        onMouseEnter={() => setHoveredId(nodeId)}
        onMouseLeave={() => setHoveredId(null)}
        data-person-id={nodeId}
      >
        {role && <span className="sablier-flow__card-role">{role}</span>}
        <div className="sablier-flow__card-name">
          <span className="sablier-flow__card-icon sablier-flow__card-icon--unknown">
            {getInitials(p.prenom, p.nom)}
          </span>
          {p.prenom} {p.nom}
          {deceased && <span style={{ color: '#c4c0ba', marginLeft: 4 }}>†</span>}
        </div>
        <div className="sablier-flow__card-meta">
          {year && <span>{year}</span>}
          {year && !deceased && <span> · Vivant</span>}
        </div>
      </div>
    )
  }

  return (
    <div className="sablier-flow" ref={containerRef} onWheel={handleWheel}>
      {/* Zoom controls */}
      <div className="sablier-flow__zoom-controls">
        <button type="button" onClick={() => setZoom(prev => Math.min(2, prev + 0.15))} aria-label="Zoom avant">+</button>
        <span style={{ minWidth: 40, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(prev => Math.max(0.3, prev - 0.15))} aria-label="Zoom arrière">−</button>
        <button type="button" onClick={() => setZoom(1)} style={{ fontSize: 11, padding: '0 8px' }} aria-label="Réinitialiser le zoom">↺</button>
      </div>
      <div
        className="sablier-flow__canvas"
        style={{
          width: layout.totalWidth,
          height: layout.totalHeight,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        {/* SVG connections */}
        <svg
          className="sablier-flow__connections"
          viewBox={`0 0 ${layout.totalWidth} ${layout.totalHeight}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {layout.connections.map((c, i) => {
            const isActive = activeConnections.has(i)
            return (
              <g key={i} style={{ opacity: isActive ? 1 : 0.08, transition: 'opacity 0.2s' }}>
                <line x1={c.fromX} y1={c.fromY} x2={c.toX} y2={c.toY}
                  strokeWidth={isActive ? 2 : 1.5} />
                <circle cx={c.fromX} cy={c.fromY} r={isActive ? 4 : 2} fill="#7c3aed" />
                <circle cx={c.toX} cy={c.toY} r={isActive ? 3 : 2} fill="#d4d0cc" />
              </g>
            )
          })}
        </svg>

        {/* Generation labels */}
        {layout.genLabels.map(gl => {
          const idx = gl.generation
          const label = GEN_LABELS[idx] ?? `Gén. ${Math.abs(idx)}`
          const colorIdx = Math.min(Math.abs(idx), 5)
          return (
            <div
              key={idx}
              className={`sablier-flow__gen-label sablier-flow__gen-label--${colorIdx}`}
              style={{ top: gl.y }}
            >
              {label}
            </div>
          )
        })}

        {/* Union groups */}
        {layout.unions.map((u, i) => (
          <div
            key={`union-${i}`}
            className="sablier-flow__union"
            style={{ left: u.x, top: u.y, width: u.width, height: u.height }}
          >
            <span className="sablier-flow__union-label">💍 Union</span>
          </div>
        ))}

        {/* Cards (excluding siblings, they render separately) */}
        {layout.nodes
          .filter(n => !layout.siblings.some(s => s.id === n.id))
          .map(n => renderCard(n.id, n.x, n.y, n.role, n.id === centerId))}

        {/* Siblings */}
        {layout.siblings.map(s => renderCard(s.id, s.x, s.y, 'Fratrie', false))}
      </div>

      <OrphanPanel orphanIds={layout.orphans} persons={persons} onSelectPerson={selectPerson} />
    </div>
  )
}
