'use client'

import { useEffect, useState } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeCosmosLayout, ORBIT_RADII } from './cosmosLayout'
import { CosmosNode } from './CosmosNode'
import { CosmosEdge } from './CosmosEdge'
import { CosmosTooltip } from './CosmosTooltip'

const DEFAULT_COLOR = '#3b82f6'

export function CosmosView() {
  const {
    persons,
    relationships,
    branches,
    personBranches,
    selectedPersonId,
    selectPerson,
    openAddPerson,
  } = useTree()

  const [hoveredId, setHoveredId] = useState<string | null>(null)

  // Auto-select first person when none is selected
  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  // Empty state
  if (persons.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          gap: 16,
          color: '#9ca3af',
        }}
      >
        <div style={{ fontSize: 18 }}>🌳 Votre arbre vous attend</div>
        <button
          onClick={openAddPerson}
          style={{
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 14,
          }}
        >
          + Ajouter une personne
        </button>
      </div>
    )
  }

  // Build branch color map: personId → couleur
  const branchColorMap = new Map<string, string>()
  for (const pb of personBranches) {
    const branch = branches.find(b => b.id === pb.branch_id)
    if (branch) {
      branchColorMap.set(pb.person_id, branch.couleur)
    }
  }

  const centerId = selectedPersonId ?? persons[0].id
  const personIds = persons.map(p => p.id)
  const { nodes, orphans } = computeCosmosLayout(personIds, relationships, centerId)

  // Derive x/y from orbit and angle
  const nodePositions = new Map(
    nodes.map(n => {
      const radius = ORBIT_RADII[n.orbit] ?? ORBIT_RADII[5]
      return [n.id, { x: Math.cos(n.angle) * radius, y: Math.sin(n.angle) * radius }]
    })
  )

  const cx = 350
  const cy = 350

  // Find hovered person for tooltip
  const hoveredPerson = hoveredId ? persons.find(p => p.id === hoveredId) ?? null : null
  const hoveredPos = hoveredId ? nodePositions.get(hoveredId) ?? null : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox="0 0 700 700"
        width="100%"
        height="100%"
      >
        {/* Edges */}
        {relationships.map(rel => {
          const pa = nodePositions.get(rel.person_a_id)
          const pb = nodePositions.get(rel.person_b_id)
          if (!pa || !pb) return null
          return (
            <CosmosEdge
              key={rel.id}
              x1={cx + pa.x}
              y1={cy + pa.y}
              x2={cx + pb.x}
              y2={cy + pb.y}
              type={rel.type}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const person = persons.find(p => p.id === node.id)
          if (!person) return null
          const pos = nodePositions.get(node.id) ?? { x: 0, y: 0 }
          return (
            <CosmosNode
              key={node.id}
              id={node.id}
              x={cx + pos.x}
              y={cy + pos.y}
              prenom={person.prenom}
              nom={person.nom}
              isSelected={node.id === selectedPersonId}
              isCenter={node.id === centerId}
              branchColor={branchColorMap.get(node.id) ?? DEFAULT_COLOR}
              onClick={selectPerson}
              onHover={setHoveredId}
            />
          )
        })}

        {/* Tooltip */}
        {hoveredPerson && hoveredPos && (
          <CosmosTooltip
            person={hoveredPerson}
            x={cx + hoveredPos.x}
            y={cy + hoveredPos.y}
          />
        )}
      </svg>

      {/* Orphan badge */}
      {orphans.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            background: '#1e3a5f',
            color: '#9ca3af',
            borderRadius: 6,
            padding: '4px 10px',
            fontSize: 12,
          }}
        >
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
