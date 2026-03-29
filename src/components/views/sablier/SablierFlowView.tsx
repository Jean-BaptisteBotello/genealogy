'use client'
import { useEffect, useMemo, useState, useRef, useCallback } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeFlowLayout } from './sablierFlowLayout'
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
  const containerRef = useRef<HTMLDivElement>(null)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      setZoom(prev => Math.min(2, Math.max(0.3, prev - e.deltaY * 0.002)))
    }
  }, [])

  if (persons.length === 0) {
    return (
      <div className="sablier-flow__empty">
        <div className="sablier-flow__empty-inner">
          <div className="sablier-flow__empty-icon">⧖</div>
          <h2 className="sablier-flow__empty-title">Votre arbre vous attend</h2>
          <p className="sablier-flow__empty-text">Commencez par ajouter la première personne.</p>
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
        <button type="button" onClick={() => setZoom(prev => Math.min(2, prev + 0.15))}>+</button>
        <span>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={() => setZoom(prev => Math.max(0.3, prev - 0.15))}>−</button>
        <button type="button" onClick={() => setZoom(1)} style={{ fontSize: 10, marginLeft: 4 }}>Reset</button>
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
          {layout.connections.map((c, i) => (
            <g key={i}>
              <line x1={c.fromX} y1={c.fromY} x2={c.toX} y2={c.toY} />
              <circle cx={c.fromX} cy={c.fromY} r={4} fill="#7c3aed" />
              <circle cx={c.toX} cy={c.toY} r={3} fill="#d4d0cc" />
            </g>
          ))}
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

      {/* Orphan badge */}
      {layout.orphans.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: 16,
            left: 16,
            background: '#fff',
            border: '1px solid #e5e2dd',
            borderRadius: 8,
            padding: '6px 12px',
            fontSize: 12,
            color: '#8a8580',
            zIndex: 10,
          }}
        >
          {layout.orphans.length} non connecté{layout.orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
