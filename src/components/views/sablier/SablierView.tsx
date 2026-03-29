'use client'
import { useEffect, useState, useCallback, useMemo } from 'react'
import ReactFlow, { Background, Controls, Handle, Position, type NodeChange, applyNodeChanges, type Node, type NodeProps } from 'reactflow'
import 'reactflow/dist/style.css'
import { useTree } from '@/lib/context/tree-context'
import { computeSablierLayout } from './sablierLayout'

const STORAGE_KEY = 'sablier_positions'

function SablierNode({ data }: NodeProps) {
  return (
    <div style={data.nodeStyle}>
      <Handle type="target" position={Position.Top} id="top" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="source" position={Position.Left} id="left" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <Handle type="target" position={Position.Right} id="right" style={{ background: 'transparent', border: 'none', width: 6, height: 6 }} />
      <div style={{ fontWeight: 600, fontSize: 13, color: data.isSelected ? '#2c2c2c' : '#3a3a3a' }}>
        {data.label}
        {data.isDeceased && <span style={{ color: '#bbb' }}> &#8224;</span>}
      </div>
      {data.dates && (
        <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{data.dates}</div>
      )}
    </div>
  )
}

const nodeTypes = { sablier: SablierNode }

type SavedPositions = Record<string, { x: number; y: number }>

function loadPositions(): SavedPositions {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function savePositions(positions: SavedPositions) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(positions))
}

export function SablierView() {
  const { persons, relationships, filteredRelationships, selectedPersonId, selectPerson, openAddPerson } = useTree()

  const [customPositions, setCustomPositions] = useState<SavedPositions>({})

  useEffect(() => {
    setCustomPositions(loadPositions())
  }, [])

  useEffect(() => {
    if (persons.length > 0 && !selectedPersonId) {
      selectPerson(persons[0].id)
    }
  }, [persons, selectedPersonId, selectPerson])

  const centerId = selectedPersonId ?? persons[0]?.id ?? ''
  const personMap = useMemo(() => new Map(persons.map(p => [p.id, p])), [persons])

  const { nodes: layoutNodes, orphans } = useMemo(
    () => computeSablierLayout(persons.map(p => p.id), relationships, centerId),
    [persons, relationships, centerId]
  )

  const CENTER_X = 400
  const CENTER_Y = 400

  const initialNodes: Node[] = useMemo(() => layoutNodes.map(n => {
    const person = personMap.get(n.id)
    const autoPos = { x: CENTER_X + n.x, y: CENTER_Y + n.y }
    const pos = customPositions[n.id] ?? autoPos
    const isSelected = n.id === centerId
    return {
      id: n.id,
      type: 'sablier',
      position: pos,
      draggable: true,
      zIndex: 10,
      data: {
        label: person ? `${person.prenom} ${person.nom}` : n.id,
        dates: person?.date_naissance ? new Date(person.date_naissance).getFullYear().toString() : '',
        isSelected,
        isDeceased: person?.date_deces != null,
        nodeStyle: {
          background: '#ffffff',
          color: '#3a3a3a',
          border: isSelected ? '2px solid #7a5a8a' : '1.5px solid #d4cece',
          borderRadius: 8,
          fontSize: 13,
          padding: '10px 16px',
          minWidth: 120,
          textAlign: 'center' as const,
          boxShadow: isSelected
            ? '0 0 0 2px rgba(122,90,138,0.2), 0 2px 8px rgba(0,0,0,0.1)'
            : '0 1px 4px rgba(0,0,0,0.06)',
          cursor: 'grab',
        },
      },
    }
  }), [layoutNodes, personMap, centerId, customPositions])

  const [nodes, setNodes] = useState<Node[]>(initialNodes)

  useEffect(() => {
    setNodes(initialNodes)
  }, [initialNodes])

  const nodeIds = useMemo(() => new Set(layoutNodes.map(n => n.id)), [layoutNodes])
  const rfEdges = useMemo(() => filteredRelationships
    .filter(r => nodeIds.has(r.person_a_id) && nodeIds.has(r.person_b_id))
    .map(r => {
      const isUnion = r.type === 'UNION'
      const isSibling = r.type === 'SIBLING' || r.type === 'HALF_SIBLING'
      const isHorizontal = isUnion || isSibling
      const isDashed = isSibling || r.type === 'ADOPTION' || r.type === 'STEP'
      return {
        id: r.id,
        type: 'straight',
        source: r.person_a_id,
        target: r.person_b_id,
        sourceHandle: isHorizontal ? 'left' : 'bottom',
        targetHandle: isHorizontal ? 'right' : 'top',
        style: {
          stroke: isUnion ? '#b07aab' : isSibling ? '#7a9bb0' : '#8a8a8a',
          strokeWidth: isUnion ? 2 : isSibling ? 1.2 : 1.5,
          strokeDasharray: isDashed ? '6 4' : undefined,
        },
      }
    }),
  [filteredRelationships, nodeIds])

  const onNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes(nds => applyNodeChanges(changes, nds))
  }, [])

  const onNodeDragStop = useCallback((_: React.MouseEvent, node: Node) => {
    setCustomPositions(prev => {
      const next = { ...prev, [node.id]: { x: node.position.x, y: node.position.y } }
      savePositions(next)
      return next
    })
  }, [])

  const hasCustomPositions = Object.keys(customPositions).length > 0

  const resetPositions = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setCustomPositions({})
  }, [])

  if (persons.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center" style={{ background: '#f0eded' }}>
        <div className="text-center">
          <div className="text-5xl mb-4">⧖</div>
          <h2 className="text-xl font-semibold mb-2" style={{ color: '#3a3a3a' }}>Votre arbre vous attend</h2>
          <p className="text-sm mb-6" style={{ color: '#999' }}>Commencez par ajouter la première personne.</p>
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

  return (
    <div className="w-full h-full relative" style={{ background: '#f0eded' }}>
      <style>{`
        .react-flow__edges { z-index: 0 !important; }
        .react-flow__edgeupdater { z-index: 0 !important; }
        .react-flow__nodes { z-index: 1 !important; }
        .react-flow__node { z-index: 10 !important; position: relative; }
      `}</style>
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onNodeClick={(_, node) => selectPerson(node.id)}
        nodesDraggable
        fitView
        elevateEdgesOnSelect={false}
      >
        <Background variant={"dots" as any} color="rgba(0,0,0,0.08)" gap={30} size={1} />
        <Controls />
      </ReactFlow>

      {hasCustomPositions && (
        <button
          type="button"
          onClick={resetPositions}
          data-testid="reset-positions"
          className="absolute bottom-14 right-4 text-xs px-3 py-1.5 rounded transition-colors"
          style={{
            background: '#ffffff',
            color: '#666',
            border: '1px solid #d4cece',
          }}
        >
          Réinitialiser les positions
        </button>
      )}

      {orphans.length > 0 && (
        <div
          className="absolute bottom-4 left-4 text-xs rounded px-2 py-1"
          style={{
            background: '#ffffff',
            color: '#666',
            border: '1px solid #d4cece',
          }}
        >
          {orphans.length} non connecté{orphans.length > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
