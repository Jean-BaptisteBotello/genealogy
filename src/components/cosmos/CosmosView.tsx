'use client'

import { useEffect, useState } from 'react'
import { useTree } from '@/lib/context/tree-context'
import { computeCosmosLayout } from './cosmosLayout'
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

  // Build node map for fast lookup
  const nodeMap = new Map(nodes.map(n => [n.id, n]))

  const cx = 350
  const cy = 350

  // Find hovered person for tooltip
  const hoveredPerson = hoveredId ? persons.find(p => p.id === hoveredId) ?? null : null
  const hoveredNode = hoveredId ? nodeMap.get(hoveredId) ?? null : null

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        viewBox="0 0 700 700"
        width="100%"
        height="100%"
      >
        {/* Edges */}
        {relationships.map(rel => {
          const na = nodeMap.get(rel.person_a_id)
          const nb = nodeMap.get(rel.person_b_id)
          if (!na || !nb) return null
          return (
            <CosmosEdge
              key={rel.id}
              x1={cx + na.x}
              y1={cy + na.y}
              x2={cx + nb.x}
              y2={cy + nb.y}
              type={rel.type}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const person = persons.find(p => p.id === node.id)
          if (!person) return null
          return (
            <CosmosNode
              key={node.id}
              id={node.id}
              x={cx + node.x}
              y={cy + node.y}
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
        {hoveredPerson && hoveredNode && (
          <CosmosTooltip
            person={hoveredPerson}
            x={cx + hoveredNode.x}
            y={cy + hoveredNode.y}
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
