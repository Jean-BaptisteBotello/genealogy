'use client'
import { useEffect } from 'react'
import ReactFlow, { Background, Controls } from 'reactflow'
import 'reactflow/dist/style.css'
import { useTree } from '@/lib/context/tree-context'
import { computeSablierLayout } from './sablierLayout'

export function SablierView() {
  const { persons, relationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">⧖</div>
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

  const centerId = selectedPersonId ?? persons[0].id
  const personMap = new Map(persons.map(p => [p.id, p]))

  const { nodes: layoutNodes, orphans } = computeSablierLayout(
    persons.map(p => p.id),
    relationships,
    centerId
  )

  const CENTER_X = 400
  const CENTER_Y = 400

  const rfNodes = layoutNodes.map(n => {
    const person = personMap.get(n.id)
    return {
      id: n.id,
      position: { x: CENTER_X + n.x, y: CENTER_Y + n.y },
      data: {
        label: person ? `${person.prenom} ${person.nom}` : n.id,
      },
      style: {
        background: n.id === centerId ? '#1e3a5f' : '#0d1117',
        color: 'white',
        border: n.id === centerId ? '2px solid #3b82f6' : '1px solid #1e3a5f',
        borderRadius: 6,
        fontSize: 12,
        padding: '4px 8px',
        minWidth: 120,
      },
    }
  })

  const nodeIds = new Set(layoutNodes.map(n => n.id))
  const rfEdges = relationships
    .filter(r => nodeIds.has(r.person_a_id) && nodeIds.has(r.person_b_id))
    .map(r => ({
      id: r.id,
      source: r.person_a_id,
      target: r.person_b_id,
      style: { stroke: r.type === 'UNION' ? '#60a5fa' : '#4b5563' },
    }))

  return (
    <div className="w-full h-full relative">
      <ReactFlow
        nodes={rfNodes}
        edges={rfEdges}
        fitView
        onNodeClick={(_, node) => selectPerson(node.id)}
      >
        <Background color="#1e3a5f" gap={40} />
        <Controls />
      </ReactFlow>

      {orphans.length > 0 && (
        <div className="absolute bottom-4 left-4 text-xs text-gray-500 bg-[#0d1117] border border-[#1e3a5f] rounded px-2 py-1">
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
